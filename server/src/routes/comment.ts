import type { FastifyInstance } from 'fastify'
import { getUser } from '../utils/auth.js'

interface UpdateCommentBody {
  text: string
}

interface VoteBody {
  value: number // 1 or -1
}

export default async function commentRoutes(server: FastifyInstance) {
  // Update a comment
  server.put<{ Params: { id: string }, Body: UpdateCommentBody }>('/comments/:id', async (request, reply) => {
    const { id } = request.params
    const { text } = request.body

    try {
      const comment = await server.prisma.comment.update({
        where: { id },
        data: { text }
      })
      return comment
    } catch (e) {
      server.log.error(e)
      return reply.code(400).send({ error: 'Failed to update comment' })
    }
  })

  // Delete a comment
  server.delete<{ Params: { id: string } }>('/comments/:id', async (request, reply) => {
    const { id } = request.params
    const userId = getUser(request) // Validate auth

    try {
      const comment = await server.prisma.comment.findUnique({ where: { id } })
      if (!comment) return reply.code(404).send({ error: 'Comment not found' })

      if (comment.userId !== userId) {
        return reply.code(403).send({ error: 'Unauthorized: You can only delete your own comments' })
      }

      await server.prisma.comment.delete({
        where: { id }
      })
      return { success: true }
    } catch (e) {
      server.log.error(e)
      return reply.code(400).send({ error: 'Failed to delete comment' })
    }
  })

  // Vote on a comment
  server.post<{ Params: { id: string }, Body: VoteBody }>('/comments/:id/vote', async (request, reply) => {
    const { id } = request.params
    const { value } = request.body
    const userId = getUser(request) // Validate auth

    if (![1, -1].includes(value)) {
        return reply.code(400).send({ error: 'Invalid vote value' })
    }

    try {
        const result = await server.prisma.$transaction(async (prisma) => {
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
                    else scoreChange = 1 // Revert downvote (-(-1) = +1) ?? No, score is just sum? 
                    // Wait, displayedScore logic.
                    // If score is net sum:
                    // Removing upvote (+1) -> -1
                    // Removing downvote (-1) -> +1
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
    } catch (e) {
        server.log.error(e)
        return reply.code(500).send({ error: 'Failed to vote' })
    }
  })
}
