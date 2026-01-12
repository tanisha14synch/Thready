import type { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Security middleware to prevent user ID manipulation in query parameters
 * This ensures that user IDs cannot be passed via query strings to override authentication
 */
export function preventUserIdInQuery(request: FastifyRequest, reply: FastifyReply, done: () => void) {
  const query = request.query as any
  const userIdFields = ['userId', 'user_id', 'user', 'id']
  
  for (const field of userIdFields) {
    if (query && field in query) {
      request.log.warn({
        type: 'security_violation',
        endpoint: request.url,
        field,
        value: query[field],
        ip: request.ip,
        userAgent: request.headers['user-agent']
      })
      reply.code(400).send({ 
        error: `Invalid request: ${field} parameter is not allowed in query string. User ID is determined from authentication token.` 
      })
      return
    }
  }
  
  done()
}

/**
 * Security middleware to log all authentication attempts
 */
export function logAuthAttempt(request: FastifyRequest, reply: FastifyReply, done: () => void) {
  const authHeader = request.headers.authorization
  const hasAuth = !!authHeader && authHeader.startsWith('Bearer ')
  
  if (!hasAuth && request.method !== 'GET') {
    request.log.warn({
      type: 'unauthenticated_request',
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent']
    })
  }
  
  done()
}

