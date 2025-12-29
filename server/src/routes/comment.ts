import type { FastifyInstance } from 'fastify'
import { CommentController } from '../controllers/commentController.js'
import { getUser } from '../utils/auth.js'

export default async function commentRoutes(server: FastifyInstance) {
  const controller = new CommentController(server.prisma)

  // Update a comment
  server.put<{ Params: { id: string }, Body: { text: string } }>('/comments/:id', async (request, reply) => {
    return controller.updateComment(request, reply)
  })

  // Delete a comment
  server.delete<{ Params: { id: string } }>('/comments/:id', async (request, reply) => {
    const userId = getUser(request)
    return controller.deleteComment(request, reply, userId)
  })

  // Vote on a comment
  server.post<{ Params: { id: string }, Body: { value: number } }>('/comments/:id/vote', async (request, reply) => {
    const userId = getUser(request)
    return controller.voteComment(request, reply, userId)
  })
}
