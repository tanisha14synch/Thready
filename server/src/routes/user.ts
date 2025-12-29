import type { FastifyInstance } from 'fastify'
import { requireJwt } from '../utils/jwt.js'

export default async function userRoutes(server: FastifyInstance) {
  server.get('/api/user/me', { preHandler: requireJwt }, async (request, reply) => {
    const userId = request.user?.id
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

    const user = await server.prisma.user.findUnique({
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
  })
}

import type { FastifyInstance } from 'fastify'
import { verifyAppJwt } from '../utils/jwt.js'

function authGuard(request: any, reply: any, done: any) {
  const header = request.headers['authorization'] as string | undefined
  if (!header || !header.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing Authorization header' })
    return
  }
  const token = header.replace('Bearer ', '')
  try {
    const decoded: any = verifyAppJwt(token)
    request.user = decoded
    done()
  } catch (err) {
    reply.code(401).send({ error: 'Invalid token' })
  }
}

export default async function userRoutes(server: FastifyInstance) {
  server.get('/user/me', { preHandler: authGuard }, async (request: any, reply) => {
    const userId = request.user?.userId
    if (!userId) return reply.code(401).send({ error: 'Invalid token payload' })

    const user = await server.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.code(404).send({ error: 'User not found' })
    return user
  })

  server.get('/user/community', { preHandler: authGuard }, async (request: any, reply) => {
    const userId = request.user?.userId
    if (!userId) return reply.code(401).send({ error: 'Invalid token payload' })

    const user = await server.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.code(404).send({ error: 'User not found' })

    // If you want name lookup, extend to join Community table
    return {
      communityId: user.communityId || null,
    }
  })
}



