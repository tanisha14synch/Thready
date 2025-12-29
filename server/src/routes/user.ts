import type { FastifyInstance } from 'fastify'
import { UserController } from '../controllers/userController.js'
import { requireJwt } from '../utils/jwt.js'

export default async function userRoutes(server: FastifyInstance) {
  const controller = new UserController(server.prisma)

  // Get current user profile
  server.get('/api/user/me', { preHandler: requireJwt }, async (request, reply) => {
    return controller.getCurrentUser(request, reply)
  })

  // Get user's community
  server.get('/api/user/community', { preHandler: requireJwt }, async (request, reply) => {
    return controller.getUserCommunity(request, reply)
  })
}
