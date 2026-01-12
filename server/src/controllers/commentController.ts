import type { PrismaClient } from '@prisma/client'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { getAuthenticatedUserId } from '../utils/auth.js'
import { 
  checkCommentOwnershipStrict,
  logUnauthorizedAccess,
  validateNoUserIdInBody,
  sanitizeRequestBody 
} from '../utils/authorization.js'

interface UpdateCommentBody {
  text: string
}

interface VoteBody {
  value: number
}

export class CommentController {
  constructor(private prisma: PrismaClient) {}

  /**
   * Update a comment
   * Requires authentication and ownership verification
   * Validates that no userId is present in request body
   */
  async updateComment(
    request: FastifyRequest<{ Params: { id: string }, Body: UpdateCommentBody }>,
    reply: FastifyReply
  ) {
    const userId = getAuthenticatedUserId(request)
    const { id } = request.params
    
    // Security: Validate that no user ID is in request body
    const bodyValidation = validateNoUserIdInBody(request.body)
    if (!bodyValidation.valid) {
      request.log.warn({
        type: 'security_validation_failed',
        endpoint: 'updateComment',
        userId,
        commentId: id,
        error: bodyValidation.error
      })
      return reply.code(400).send({ error: bodyValidation.error })
    }
    
    // Sanitize body to remove any user ID fields
    const sanitizedBody = sanitizeRequestBody(request.body)
    const { text } = sanitizedBody

    if (!text || !text.trim()) {
      return reply.code(400).send({ error: 'Comment text is required' })
    }

    try {
      // First verify ownership
      const comment = await this.prisma.comment.findUnique({ where: { id } })
      if (!comment) {
        return reply.code(404).send({ error: 'Comment not found' })
      }
      
      // Check ownership using strict mode (no legacy comments allowed)
      const ownershipCheck = checkCommentOwnershipStrict(comment.userId, userId)
      if (!ownershipCheck.authorized) {
        logUnauthorizedAccess(request, 'comment', id, comment.userId || 'unknown', userId)
        return reply.code(ownershipCheck.error!.code).send({ error: ownershipCheck.error!.message })
      }

      const updatedComment = await this.prisma.comment.update({
        where: { id },
        data: { text: text.trim() }
      })
      return updatedComment
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: 'Failed to update comment' })
    }
  }

  /**
   * Delete a comment
   * STRICT OWNERSHIP ENFORCEMENT:
   * - User can ONLY delete comments created by their own user ID
   * - comment.userId MUST equal authenticatedUser.id (strict equality)
   * - No exceptions: legacy/null comments cannot be deleted
   * - Server-side validation only (no frontend checks)
   * - Returns 403 Forbidden for any unauthorized attempt
   * - Prevents deletion via manipulated comment IDs
   */
  async deleteComment(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const authenticatedUserId = getAuthenticatedUserId(request)
    const { id } = request.params

    try {
      // Step 1: Fetch the comment from database
      const comment = await this.prisma.comment.findUnique({ 
        where: { id },
        select: {
          id: true,
          userId: true,
          text: true,
          postId: true
        }
      })
      
      // Step 2: Verify comment exists
      if (!comment) {
        return reply.code(404).send({ error: 'Comment not found' })
      }

      // Step 3: STRICT OWNERSHIP VERIFICATION
      // Convert both to strings to ensure exact comparison (no type mismatch)
      const commentUserIdStr = String(comment.userId || '').trim()
      const authenticatedUserIdStr = String(authenticatedUserId || '').trim()
      
      // Log for debugging
      request.log.info({
        type: 'comment_deletion_attempt',
        commentId: id,
        commentUserId: commentUserIdStr,
        authenticatedUserId: authenticatedUserIdStr,
        userIdsMatch: commentUserIdStr === authenticatedUserIdStr,
        timestamp: new Date().toISOString()
      })
      
      // STRICT CHECK: comment.userId MUST equal authenticatedUser.id (exact string match)
      // No exceptions, no legacy comments, no null checks
      if (!commentUserIdStr || commentUserIdStr === 'legacy' || commentUserIdStr === 'null') {
        request.log.warn({
          type: 'comment_deletion_blocked_invalid_userid',
          commentId: id,
          commentUserId: commentUserIdStr,
          authenticatedUserId: authenticatedUserIdStr,
          reason: 'Comment has invalid or legacy userId'
        })
        return reply.code(403).send({ 
          error: 'Forbidden: Comment ownership cannot be verified' 
        })
      }
      
      // STRICT EQUALITY CHECK - must match exactly
      if (commentUserIdStr !== authenticatedUserIdStr) {
        // Log unauthorized access attempt with full details
        logUnauthorizedAccess(
          request, 
          'comment', 
          id, 
          commentUserIdStr, 
          authenticatedUserIdStr
        )
        
        // Return 403 Forbidden - block action completely
        return reply.code(403).send({ 
          error: 'Forbidden: You can only delete your own comments' 
        })
      }

      // Step 5: Only proceed with deletion if all checks pass
      await this.prisma.comment.delete({
        where: { id }
      })
      
      request.log.info({
        type: 'comment_deleted',
        commentId: id,
        userId: authenticatedUserId,
        timestamp: new Date().toISOString()
      })
      
      return { success: true }
    } catch (error: any) {
      // Log error but don't expose internal details
      request.log.error({
        type: 'comment_deletion_error',
        commentId: id,
        userId: authenticatedUserId,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      // Return generic error to prevent information leakage
      return reply.code(500).send({ error: 'Failed to delete comment' })
    }
  }

  /**
   * Vote on a comment
   * Requires authentication - user ID comes from JWT token
   */
  async voteComment(
    request: FastifyRequest<{ Params: { id: string }, Body: VoteBody }>,
    reply: FastifyReply
  ) {
    const userId = getAuthenticatedUserId(request)
    const { id } = request.params
    const { value } = request.body

    if (![1, -1].includes(value)) {
      return reply.code(400).send({ error: 'Invalid vote value' })
    }

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        // Check existing vote
        const existingVote = await prisma.commentVote.findUnique({
          where: {
            commentId_user: {
              commentId: id,
              user: userId
            }
          }
        })

        let scoreChange = 0

        if (existingVote) {
          if (existingVote.value === value) {
            // Toggle off (remove vote)
            await prisma.commentVote.delete({
              where: { id: existingVote.id }
            })
            if (value === 1) scoreChange = -1
            else scoreChange = 1
          } else {
            // Change vote
            await prisma.commentVote.update({
              where: { id: existingVote.id },
              data: { value }
            })
            // If changing from 1 to -1: -2
            // If changing from -1 to 1: +2
            if (value === 1) scoreChange = 2
            else scoreChange = -2
          }
        } else {
          // New vote
          await prisma.commentVote.create({
            data: {
              commentId: id,
              user: userId,
              value
            }
          })
          if (value === 1) scoreChange = 1
          else scoreChange = -1
        }

        // Update comment score
        const comment = await prisma.comment.update({
          where: { id },
          data: {
            displayedScore: { increment: scoreChange }
          }
        })

        return comment
      })

      return result
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: 'Failed to vote' })
    }
  }
}




