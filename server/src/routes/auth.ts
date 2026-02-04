import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { buildCustomerAccountAuthUrl, verifyState, verifyHmac, exchangeCodeForToken, createState, getShopFromState } from '../services/shopify-oauth.js'
import { signJwt } from '../utils/jwt.js'

const SHOP_SUFFIX = '.myshopify.com'

function getBaseUrl(): string {
  return process.env.BASE_URL || process.env.SHOPIFY_REDIRECT_URI?.replace(/\/auth\/shopify\/callback.*$/, '') || 'http://localhost:3001'
}

function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:3000'
}

function isValidShop(shop: string): boolean {
  if (!shop || typeof shop !== 'string') return false
  const s = shop.trim().toLowerCase()
  return s.endsWith(SHOP_SUFFIX) && s.length > SHOP_SUFFIX.length
}

export default async function authRoutes(server: FastifyInstance) {
  /**
   * GET /auth?shop=xxx.myshopify.com
   * Start OAuth: validate shop, build Shopify authorize URL, redirect (302).
   */
  server.get('/auth', async (request: FastifyRequest<{ Querystring: { shop?: string } }>, reply: FastifyReply) => {
    const shop = request.query.shop
    if (!isValidShop(shop!)) {
      return reply.redirect(getFrontendUrl() + '/?error=invalid_shop_param', 302)
    }
    try {
      const state = createState(shop!)
      const authUrl = buildCustomerAccountAuthUrl(state)
      return reply.redirect(authUrl, 302)
    } catch (err) {
      server.log.error(err)
      return reply.redirect(getFrontendUrl() + '/?error=auth_url_failed', 302)
    }
  })

  /**
   * GET /auth/shopify/callback?code=...&shop=...&state=...&hmac=...
   * Callback from Shopify: verify state/hmac, exchange code for token, then redirect to frontend with JWT.
   */
  server.get(
    '/auth/shopify/callback',
    async (
      request: FastifyRequest<{
        Querystring: { code?: string; shop?: string; state?: string; hmac?: string }
      }>,
      reply: FastifyReply
    ) => {
      const { code, shop: shopQuery, state, hmac } = request.query
      if (!code || !state) {
        return reply.redirect(getFrontendUrl() + '/?error=missing_params', 302)
      }
      let shop = shopQuery
      if (!shop || !isValidShop(shop)) {
        shop = getShopFromState(state) || undefined
      }
      if (!shop || !isValidShop(shop)) {
        return reply.redirect(getFrontendUrl() + '/?error=invalid_shop', 302)
      }
      const query = request.query as Record<string, string | undefined>
      if (hmac && !verifyHmac(query)) {
        return reply.redirect(getFrontendUrl() + '/?error=invalid_hmac', 302)
      }
      if (!verifyState(state, shop)) {
        return reply.redirect(getFrontendUrl() + '/?error=invalid_state', 302)
      }
      try {
        const { access_token } = await exchangeCodeForToken(shop, code)
        const shopIdEnv = process.env.SHOPIFY_SHOP_ID || ''
        const jwt = await signJwt({ shop, shopId: shopIdEnv })
        const frontendCallback = getFrontendUrl() + '/auth/shopify/callback?token=' + encodeURIComponent(jwt)
        return reply.redirect(frontendCallback, 302)
      } catch (err) {
        server.log.error(err)
        return reply.redirect(getFrontendUrl() + '/?error=token_exchange_failed', 302)
      }
    }
  )

  /**
   * GET /auth/me - return current user when Authorization: Bearer <jwt> is present.
   */
  server.get('/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const { getAuthUser } = await import('../utils/auth.js')
    const auth = await getAuthUser(request)
    if (!auth) return reply.code(401).send({ error: 'Unauthorized' })
    return { user: { id: auth.userId, username: auth.username }, shop: auth.shop }
  })
}
