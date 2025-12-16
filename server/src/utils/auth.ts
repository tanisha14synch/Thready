import { FastifyRequest } from 'fastify'

export function getUser(request: FastifyRequest): string {
  // For demo purposes we allow a fallback user when header is missing.
  const userId = request.headers['x-user-id'] as string | undefined
  if (!userId) {
    return 'demo-user'
  }
  return userId
}
