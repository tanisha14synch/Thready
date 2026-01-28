import jwt from 'jsonwebtoken'
import type { FastifyRequest, FastifyReply } from 'fastify'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_change_in_production'

// Extend FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      shopifyCustomerId: string
    }
  }
}

export interface JwtPayload {
  userId: string
  shopifyCustomerId: string
}

export interface SessionJwtPayload {
  customerId: string
  email: string
  firstName?: string
  lastName?: string
  displayName: string
  shopifyAccessToken?: string
  iat?: number
  exp?: number
}

/**
 * Sign a JWT token for app authentication
 * Used for API authentication via Authorization header
 */
export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  })
}

/**
 * Sign a session JWT token for cookie-based authentication
 * Used for HTTP-only session cookies
 */
export function signSessionJwt(payload: Omit<SessionJwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  })
}

/**
 * Verify and decode a JWT token
 * Returns null if token is invalid or expired
 */
export function verifyJwt<T extends JwtPayload | SessionJwtPayload>(token: string): T | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as T
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Middleware: Require JWT authentication
 * Extracts user ID from JWT token and attaches to request
 */
export async function requireJwt(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Authentication required' })
  }

  const token = authHeader.substring(7)
  const payload = verifyJwt<JwtPayload>(token)

  if (!payload || !payload.userId) {
    return reply.code(401).send({ error: 'Invalid or expired token' })
  }

  // Attach user info to request
  request.user = {
    id: payload.userId,
    shopifyCustomerId: payload.shopifyCustomerId,
  }
}

/**
 * Middleware: Optional JWT authentication
 * Extracts user ID from JWT token if present, but doesn't require it
 */
export async function optionalJwt(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided - request continues without user
    return
  }

  const token = authHeader.substring(7)
  const payload = verifyJwt<JwtPayload>(token)

  if (payload && payload.userId) {
    // Attach user info to request if token is valid
    request.user = {
      id: payload.userId,
      shopifyCustomerId: payload.shopifyCustomerId,
    }
  }
}
