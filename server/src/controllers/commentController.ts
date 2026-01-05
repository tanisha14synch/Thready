import type { PrismaClient } from '@prisma/client'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { getAuthenticatedUserId } from '../utils/auth.js'

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
   */
  async updateComment(
    request: FastifyRequest<{ Params: { id: string }, Body: UpdateCommentBody }>,
    reply: FastifyReply
  ) {
    const userId = getAuthenticatedUserId(request)
    const { id } = request.params
    const { text } = request.body

    if (!text || !text.trim()) {
      return reply.code(400).send({ error: 'Comment text is required' })
    }

    try {
      // First verify ownership
      const comment = await this.prisma.comment.findUnique({ where: { id } })
      if (!comment) {
        return reply.code(404).send({ error: 'Comment not found' })
      }
      
      if (comment.userId !== userId) {
        return reply.code(403).send({ error: 'Unauthorized: You can only update your own comments' })
      }

      const updatedComment = await this.prisma.comment.update({
        where: { id },
        data: { text: text.trim() }
      })
      return updatedComment
    } catch (error) {
      request.log.error(error)
      return reply.code(400).send({ error: 'Failed to update comment' })
    }
  }

  /**
   * Delete a comment
   * Requires authentication and ownership verification
   */
  async deleteComment(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = getAuthenticatedUserId(request)
    const { id } = request.params

    try {
      const comment = await this.prisma.comment.findUnique({ where: { id } })
      if (!comment) return reply.code(404).send({ error: 'Comment not found' })

      if (comment.userId !== userId) {
        return reply.code(403).send({ error: 'Unauthorized: You can only delete your own comments' })
      }

      await this.prisma.comment.delete({
        where: { id }
      })
      return { success: true }
    } catch (error) {
      request.log.error(error)
      return reply.code(400).send({ error: 'Failed to delete comment' })
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




