import type { FastifyRequest } from 'fastify'

/**
 * Check if user owns a resource
 */
export function checkOwnershipOrForbid(
  resourceUserId: string | null | undefined,
  authenticatedUserId: string,
  resourceType: string
): { authorized: boolean; error?: { code: number; message: string } } {
  if (!resourceUserId) {
    return {
      authorized: false,
      error: {
        code: 403,
        message: `${resourceType} ownership cannot be verified`,
      },
    }
  }

  if (resourceUserId !== authenticatedUserId) {
    return {
      authorized: false,
      error: {
        code: 403,
        message: `You can only modify your own ${resourceType}s`,
      },
    }
  }

  return { authorized: true }
}

/**
 * Check comment ownership (strict mode - no legacy comments)
 */
export function checkCommentOwnershipStrict(
  commentUserId: string | null | undefined,
  authenticatedUserId: string
): { authorized: boolean; error?: { code: number; message: string } } {
  const commentUserIdStr = String(commentUserId || '').trim()

  if (!commentUserIdStr || commentUserIdStr === 'legacy' || commentUserIdStr === 'null') {
    return {
      authorized: false,
      error: {
        code: 403,
        message: 'Comment ownership cannot be verified',
      },
    }
  }

  if (commentUserIdStr !== authenticatedUserId) {
    return {
      authorized: false,
      error: {
        code: 403,
        message: 'You can only modify your own comments',
      },
    }
  }

  return { authorized: true }
}

/**
 * Log unauthorized access attempts
 */
export function logUnauthorizedAccess(
  request: FastifyRequest,
  resourceType: string,
  resourceId: string,
  resourceUserId: string,
  authenticatedUserId: string
): void {
  request.log.warn({
    type: 'unauthorized_access_attempt',
    resourceType,
    resourceId,
    resourceUserId,
    authenticatedUserId,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Validate that request body doesn't contain user ID fields
 */
export function validateNoUserIdInBody(
  body: any,
  allowedFields: string[] = []
): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: true }
  }

  const userIdFields = ['userId', 'user_id', 'user', 'authorId', 'author_id']
  
  for (const field of userIdFields) {
    if (allowedFields.includes(field)) {
      continue
    }
    
    if (field in body && body[field] !== undefined && body[field] !== null) {
      return {
        valid: false,
        error: `User ID cannot be specified in request body (field: ${field})`,
      }
    }
  }

  return { valid: true }
}

/**
 * Sanitize request body by removing user ID fields
 */
export function sanitizeRequestBody(body: any, allowedFields: string[] = []): any {
  if (!body || typeof body !== 'object') {
    return body
  }

  const sanitized = { ...body }
  const userIdFields = ['userId', 'user_id', 'authorId', 'author_id']
  
  for (const field of userIdFields) {
    if (!allowedFields.includes(field) && field in sanitized) {
      delete sanitized[field]
    }
  }

  return sanitized
}
