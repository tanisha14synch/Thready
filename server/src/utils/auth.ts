import type { FastifyRequest } from 'fastify'

/**
 * Get authenticated user ID from request
 * Expects request.user to be set by requireJwt middleware
 */
export function getAuthenticatedUserId(request: FastifyRequest): string {
  const user = (request as any).user
  if (!user || !user.id) {
    throw new Error('User not authenticated')
  }
  return user.id
}
