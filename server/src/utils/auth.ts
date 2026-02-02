import type { FastifyRequest } from 'fastify'
import { verifyJwt } from './jwt.js'

export interface AuthUser {
  userId: string
  username: string
  shop?: string
}

/**
 * Sync fallback: x-user-id header or demo-user. Used when JWT is not present.
 */
export function getUser(request: FastifyRequest): string {
  const userId = request.headers['x-user-id'] as string | undefined
  if (!userId) {
    return 'demo-user'
  }
  return userId
}

/**
 * Resolve authenticated user from JWT (Authorization: Bearer) or fallback to x-user-id.
 * Use this in protected routes; prefer JWT when present.
 */
export async function getAuthUser(request: FastifyRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) {
    const payload = await verifyJwt(token)
    if (payload) {
      return {
        userId: payload.shopId,
        username: payload.shop.replace('.myshopify.com', ''),
        shop: payload.shop,
      }
    }
  }
  const fallback = getUser(request)
  if (fallback && fallback !== 'demo-user') {
    return { userId: fallback, username: fallback }
  }
  return null
}

/**
 * Get current user id for use in posts/comments: JWT shopId, or x-user-id, or demo-user.
 */
export async function getUserId(request: FastifyRequest): Promise<string> {
  const auth = await getAuthUser(request)
  if (auth) return auth.userId
  return getUser(request)
}

/**
 * Get display username for current user: JWT shop name, or x-user-id, or 'demo-user'.
 */
export async function getUsername(request: FastifyRequest): Promise<string> {
  const auth = await getAuthUser(request)
  if (auth) return auth.username
  return getUser(request)
}
