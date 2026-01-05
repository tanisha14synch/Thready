import { FastifyRequest } from 'fastify'

/**
 * Get authenticated user ID from JWT token
 * This function requires that requireJwt middleware has been called first
 * to set request.user.id
 */
export function getAuthenticatedUserId(request: FastifyRequest): string {
  const userId = request.user?.id
  if (!userId) {
    throw new Error('Unauthorized: User ID not found in request. Ensure requireJwt middleware is applied.')
  }
  return userId
}

/**
 * Verify that the requested user ID matches the authenticated user ID
 * Throws an error if they don't match
 */
export function verifyUserOwnership(request: FastifyRequest, requestedUserId: string): void {
  const authenticatedUserId = getAuthenticatedUserId(request)
  if (authenticatedUserId !== requestedUserId) {
    throw new Error('Forbidden: You can only access your own data')
  }
}
