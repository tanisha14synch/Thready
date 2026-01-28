import jwt from 'jsonwebtoken'
import type { FastifyReply, FastifyRequest } from 'fastify'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'

export type AppJwtPayload = {
  userId: string
  shopifyCustomerId?: string
}

export type SessionJwtPayload = {
  customerId: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  shopifyAccessToken?: string
  iat?: number
}

export function signJwt(payload: AppJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function signSessionJwt(payload: SessionJwtPayload): string {
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyJwt<T>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T
  } catch {
    return null
  }
}

export function requireJwt(request: FastifyRequest, reply: FastifyReply, done: () => void) {
  const auth = request.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Unauthorized' })
    return
  }
  const token = auth.slice('Bearer '.length).trim()
  const decoded = verifyJwt<AppJwtPayload>(token)
  if (!decoded?.userId) {
    reply.code(401).send({ error: 'Unauthorized' })
    return
  }
  // @ts-expect-error - attached for downstream usage
  request.user = { id: decoded.userId }
  done()
}

/** Optional JWT: does not fail when no token; attaches user when token is valid. */
export function optionalJwt(request: FastifyRequest, _reply: FastifyReply, done: () => void) {
  const auth = request.headers.authorization
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim()
    const decoded = verifyJwt<AppJwtPayload>(token)
    if (decoded?.userId) {
      // @ts-expect-error - attached for downstream usage
      request.user = { id: decoded.userId }
    }
  }
  done()
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string }
  }
}



