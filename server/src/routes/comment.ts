import type { FastifyInstance } from 'fastify'
import { CommentController } from '../controllers/commentController.js'
import { requireJwt } from '../utils/jwt.js'

export default async function commentRoutes(server: FastifyInstance) {
  const controller = new CommentController(server.prisma)

  // Update a comment (requires authentication and ownership)
  server.put<{ Params: { id: string }, Body: { text: string } }>('/comments/:id', { preHandler: requireJwt }, async (request, reply) => {
    return controller.updateComment(request, reply)
  })

  // Delete a comment (requires authentication and ownership)
  server.delete<{ Params: { id: string } }>('/comments/:id', { preHandler: requireJwt }, async (request, reply) => {
    return controller.deleteComment(request, reply)
  })

  // Vote on a comment (requires authentication)
  server.post<{ Params: { id: string }, Body: { value: number } }>('/comments/:id/vote', { preHandler: requireJwt }, async (request, reply) => {
    return controller.voteComment(request, reply)
  })
}
