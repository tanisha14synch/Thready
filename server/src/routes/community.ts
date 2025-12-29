import type { FastifyInstance } from 'fastify'
import { CommunityController } from '../controllers/communityController.js'

export default async function communityRoutes(server: FastifyInstance) {
  const controller = new CommunityController(server.prisma)

  // Get all communities
  server.get('/communities', async (request, reply) => {
    return controller.getCommunities(request, reply)
  })

  // Get a specific community by ID
  server.get<{ Params: { id: string } }>('/communities/:id', async (request, reply) => {
    return controller.getCommunityById(request, reply)
  })

  // Create a new community
  server.post<{ Body: any }>('/communities', async (request, reply) => {
    return controller.createCommunity(request, reply)
  })
}
