import type { FastifyInstance } from 'fastify'
import { AuthController } from '../controllers/authController.js'

export default async function authRoutes(server: FastifyInstance) {
  try {
    // Test route to verify routes are loading
    server.get('/test-auth-routes', async () => {
      return { message: 'Auth routes are loaded successfully!' }
    })

    const controller = new AuthController(server.prisma)

    // ===========================================
    // CUSTOMER ACCOUNT API OAUTH 2.0 FLOW
    // ===========================================

    // GET /auth/shopify/login
    // Initiates Customer Account API OAuth flow - redirects to Shopify
    server.get<{ Querystring: { returnTo?: string } }>('/auth/shopify/login', async (request, reply) => {
      return controller.initiateCustomerAccountOAuth(request, reply)
    })

    // GET /auth/shopify/callback
    // Handles Customer Account API OAuth callback from Shopify
    server.get<{ Querystring: { code?: string; state?: string; error?: string; error_description?: string } }>('/auth/shopify/callback', async (request, reply) => {
      return controller.handleCustomerAccountCallback(request, reply)
    })

    // GET /auth/me
    // Returns current authenticated user from session cookie
    server.get('/auth/me', async (request, reply) => {
      return controller.getCurrentSession(request, reply)
    })

    // POST /auth/logout
    // Clears session cookie
    server.post('/auth/logout', async (request, reply) => {
      return controller.logout(request, reply)
    })

    // POST /auth/refresh
    // Refreshes the session token
    server.post('/auth/refresh', async (request, reply) => {
      return controller.refreshSession(request, reply)
    })

    // ===========================================
    // LEGACY ENDPOINTS (for backward compatibility)
    // ===========================================

    // OAuth 2.0: Initiate Shopify OAuth flow (legacy - redirects to Customer Account API)
    server.get<{ Querystring: { shop?: string } }>('/auth/shopify/authorize', async (request, reply) => {
      return controller.initiateOAuth(request, reply)
    })

    // Legacy: Shopify customer login redirect (HMAC-based)
    server.get<{ Querystring: Record<string, any> }>('/auth/shopify', async (request, reply) => {
      return controller.handleShopifyRedirect(request, reply)
    })

    // Login required endpoint
    server.get('/login-required', async () => {
      return { error: 'login_required' }
    })

    server.log.info('Auth routes registered successfully')
  } catch (error: any) {
    server.log.error('Error registering auth routes:', error)
    throw error
  }
}
