import type { FastifyInstance } from 'fastify'
import { buildAuthUrl, verifyHmac, verifyState, createState, exchangeCodeForToken } from '../services/shopify-oauth.js'
import { signJwt } from '../utils/jwt.js'

export default async function authRoutes(server: FastifyInstance) {
  /**
   * GET /auth?shop=xxx.myshopify.com
   * Redirects the browser to Shopify OAuth. Frontend "Log in with Shopify" links here.
   */
  server.get<{ Querystring: { shop?: string } }>('/auth', async (request, reply) => {
    const shop = request.query.shop || process.env.SHOPIFY_SHOP || process.env.SHOPIFY_SHOP_DOMAIN
    if (!shop || !shop.includes('myshopify.com')) {
      return reply.code(400).send({ error: 'Missing or invalid shop. Use ?shop=your-store.myshopify.com' })
    }
    const state = createState(shop)
    const authUrl = buildAuthUrl(shop, state)
    return reply.redirect(302, authUrl)
  })

  /**
   * POST /auth/exchange
   * Called by the frontend after Shopify redirects to /auth/shopify/callback with code, shop, hmac, state.
   * Verifies HMAC and state, exchanges code for access token, stores Shop, returns JWT for localStorage.
   */
  server.post<{
    Body: { code?: string; shop?: string; hmac?: string; state?: string }
  }>('/auth/exchange', async (request, reply) => {
    const { code, shop, hmac, state } = request.body || {}
    if (!code || !shop) {
      return reply.code(400).send({ error: 'Missing code or shop' })
    }

    const query = { code, shop, hmac, state } as Record<string, string | undefined>
    if (!verifyHmac(query)) {
      return reply.code(401).send({ error: 'Invalid HMAC' })
    }
    if (!state || !verifyState(state, shop)) {
      return reply.code(401).send({ error: 'Invalid or expired state' })
    }

    let accessToken: string
    let scope: string | undefined
    try {
      const result = await exchangeCodeForToken(shop, code)
      accessToken = result.access_token
      scope = result.scope
    } catch (err) {
      server.log.error(err)
      return reply.code(502).send({ error: 'Failed to exchange code for token' })
    }

    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const prisma = server.prisma

    const shopRow = await prisma.shop.upsert({
      where: { shop: cleanShop },
      create: { shop: cleanShop, accessToken, scope },
      update: { accessToken, scope, updatedAt: new Date() },
    })

    const jwt = await signJwt({ shop: cleanShop, shopId: shopRow.id })

    const frontendUrl = process.env.FRONTEND_URL || process.env.COMMUNITY_URL || 'https://thready-ruby.vercel.app'
    return reply.send({
      jwt,
      user: {
        id: shopRow.id,
        shop: cleanShop,
        username: cleanShop.replace('.myshopify.com', ''),
      },
      redirectUrl: `${frontendUrl}/auth/shopify/callback?token=${encodeURIComponent(jwt)}`,
    })
  })

  /**
   * GET /auth/me
   * Returns current user/shop from JWT in Authorization header. Frontend calls this to hydrate user after load.
   */
  server.get('/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return reply.code(401).send({ error: 'Missing or invalid Authorization header' })
    }
    const { verifyJwt } = await import('../utils/jwt.js')
    const payload = await verifyJwt(token)
    if (!payload) {
      return reply.code(401).send({ error: 'Invalid or expired token' })
    }
    const shopRow = await server.prisma.shop.findUnique({
      where: { id: payload.shopId },
    })
    if (!shopRow) {
      return reply.code(401).send({ error: 'Shop not found' })
    }
    return reply.send({
      user: {
        id: shopRow.id,
        shop: shopRow.shop,
        username: shopRow.shop.replace('.myshopify.com', ''),
      },
    })
  })
}
