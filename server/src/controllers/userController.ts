import type { PrismaClient } from '@prisma/client'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { getAuthenticatedUserId } from '../utils/auth.js'

export class UserController {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get current user profile
   * Strictly returns only the authenticated user's data
   * User ID is always from JWT token, never from request parameters
   */
  async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
    const userId = getAuthenticatedUserId(request)

    try {
      // Always query by authenticated user ID - no parameters can override this
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

      if (!user) {
        return reply.code(404).send({ error: 'User not found' })
      }

      return user
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: 'Failed to fetch user' })
    }
  }

  /**
   * Get user's community
   * Strictly returns only the authenticated user's community
   * User ID is always from JWT token, never from request parameters
   */
  async getUserCommunity(request: FastifyRequest, reply: FastifyReply) {
    const userId = getAuthenticatedUserId(request)

    try {
      // Always query by authenticated user ID - no parameters can override this
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          communityId: true
        }
      })

      if (!user) {
        return reply.code(404).send({ error: 'User not found' })
      }

      return {
        communityId: user.communityId || null,
      }
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: 'Failed to fetch user community' })
    }
  }
}






