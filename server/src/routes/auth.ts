import type { FastifyInstance } from 'fastify'
import { AuthController } from '../controllers/authController.js'

export default async function authRoutes(server: FastifyInstance) {
  const controller = new AuthController(server.prisma)

  // OAuth 2.0: Initiate Shopify OAuth flow
  server.get('/auth/shopify/authorize', async (request, reply) => {
    return controller.initiateOAuth(request, reply)
  })

  // OAuth 2.0: Handle Shopify callback
  server.get('/auth/shopify/callback', async (request, reply) => {
    return controller.handleOAuthCallback(request, reply)
  })

  // Legacy: Shopify customer login redirect (HMAC-based)
  server.get('/auth/shopify', async (request, reply) => {
    return controller.handleShopifyRedirect(request, reply)
  })

  // Login required endpoint
  server.get('/login-required', async () => {
    return { error: 'login_required' }
  })
}
