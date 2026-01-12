import type { FastifyRequest, FastifyReply } from 'fastify'
import { getAuthenticatedUserId } from './auth.js'

/**
 * Authorization utility functions for strict user-level access control
 */

/**
 * Verify that a resource belongs to the authenticated user
 * Returns true if authorized, false otherwise
 * 
 * @param strictMode - If true, does not allow legacy/null resources (for strict ownership enforcement)
 */
export function verifyResourceOwnership(
  resourceUserId: string | null | undefined,
  authenticatedUserId: string,
  strictMode: boolean = false
): boolean {
  // In strict mode, null or legacy user IDs are NOT allowed
  if (strictMode) {
    if (!resourceUserId || resourceUserId === 'legacy') {
      return false // Strict mode: no access to legacy/null resources
    }
    // Strict equality check - must match exactly
    return resourceUserId === authenticatedUserId
  }
  
  // Legacy resources (userId === 'legacy' or null) are considered public
  // This is for backward compatibility with seeded data (posts only)
  if (!resourceUserId || resourceUserId === 'legacy') {
    return true // Allow access to legacy resources
  }
  return resourceUserId === authenticatedUserId
}

/**
 * Check ownership and return appropriate error response if unauthorized
 * Use this in controllers to verify resource ownership
 * 
 * @param strictMode - If true, enforces strict ownership (no legacy/null resources allowed)
 */
export function checkOwnershipOrForbid(
  resourceUserId: string | null | undefined,
  authenticatedUserId: string,
  resourceType: string = 'resource',
  strictMode: boolean = false
): { authorized: boolean; error?: { code: number; message: string } } {
  if (!verifyResourceOwnership(resourceUserId, authenticatedUserId, strictMode)) {
    return {
      authorized: false,
      error: {
        code: 403,
        message: `Forbidden: You can only ${resourceType === 'comment' ? 'delete' : 'access'} your own ${resourceType}`
      }
    }
  }
  return { authorized: true }
}

/**
 * Strict ownership check for comments - NO exceptions
 * Comments must have a valid userId that matches the authenticated user
 * Legacy or null comments cannot be deleted by anyone
 */
export function checkCommentOwnershipStrict(
  commentUserId: string | null | undefined,
  authenticatedUserId: string
): { authorized: boolean; error?: { code: number; message: string } } {
  // Strict validation: comment must have a userId
  if (!commentUserId) {
    return {
      authorized: false,
      error: {
        code: 403,
        message: 'Forbidden: Comment ownership cannot be verified'
      }
    }
  }
  
  // Strict equality check - must match exactly
  if (commentUserId !== authenticatedUserId) {
    return {
      authorized: false,
      error: {
        code: 403,
        message: 'Forbidden: You can only delete your own comments'
      }
    }
  }
  
  return { authorized: true }
}

/**
 * Log unauthorized access attempts for security monitoring
 */
export function logUnauthorizedAccess(
  request: FastifyRequest,
  resourceType: string,
  resourceId: string,
  attemptedUserId: string,
  authenticatedUserId: string
): void {
  request.log.warn({
    type: 'unauthorized_access_attempt',
    resourceType,
    resourceId,
    attemptedUserId,
    authenticatedUserId,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    timestamp: new Date().toISOString()
  })
}

/**
 * Validate that no user ID is present in request body that could override authentication
 * This prevents ID manipulation attacks
 */
export function validateNoUserIdInBody(
  body: any,
  allowedFields: string[] = []
): { valid: boolean; error?: string } {
  const userIdFields = ['userId', 'user_id', 'user', 'id']
  
  for (const field of userIdFields) {
    if (allowedFields.includes(field)) continue
    if (body && typeof body === 'object' && field in body) {
      return {
        valid: false,
        error: `Invalid request: ${field} field is not allowed in request body. User ID is determined from authentication token.`
      }
    }
  }
  
  return { valid: true }
}

/**
 * Sanitize request body to remove any user ID fields
 * This ensures user ID can never be overridden from request body
 */
export function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') return body
  
  const sanitized = { ...body }
  const userIdFields = ['userId', 'user_id']
  
  for (const field of userIdFields) {
    delete sanitized[field]
  }
  
  return sanitized
}

/**
 * Get a single resource and verify ownership
 * Returns the resource if authorized, null if not found, throws if unauthorized
 */
export async function getResourceWithOwnershipCheck<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  findFunction: () => Promise<T | null>,
  resourceType: string = 'resource'
): Promise<{ resource: T; authorized: boolean } | null> {
  const authenticatedUserId = getAuthenticatedUserId(request)
  const resource = await findFunction()
  
  if (!resource) {
    return null // Resource not found
  }
  
  // Check if resource has userId property
  const resourceUserId = (resource as any).userId
  
  const ownershipCheck = checkOwnershipOrForbid(
    resourceUserId,
    authenticatedUserId,
    resourceType
  )
  
  if (!ownershipCheck.authorized) {
    const resourceId = (resource as any).id || 'unknown'
    logUnauthorizedAccess(
      request,
      resourceType,
      resourceId,
      resourceUserId || 'unknown',
      authenticatedUserId
    )
    reply.code(ownershipCheck.error!.code).send({ error: ownershipCheck.error!.message })
    return { resource, authorized: false }
  }
  
  return { resource, authorized: true }
}

