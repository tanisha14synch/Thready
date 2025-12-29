import type { PrismaClient } from '@prisma/client'
import type { FastifyRequest, FastifyReply } from 'fastify'

export class UserController {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get current user profile
   */
  async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          shopifyCustomerId: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          profileImage: true,
          avatarColor: true,
          communityId: true,
          createdAt: true,
        },
      })

      if (!user) return reply.code(404).send({ error: 'User not found' })

      return user
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: 'Failed to fetch user' })
    }
  }

  /**
   * Get user's community
   */
  async getUserCommunity(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          communityId: true
        }
      })

      if (!user) return reply.code(404).send({ error: 'User not found' })

      return {
        communityId: user.communityId || null,
      }
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: 'Failed to fetch user community' })
    }
  }
}

