import type { PrismaClient } from '@prisma/client'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyShopify } from '../auth/shopify.js'
import { fetchShopifyCustomer, parseShopifyTags, mapCommunityFromTags, generateAvatarColor } from '../utils/shopifyAdmin.js'
import { signJwt } from '../utils/jwt.js'
import {
  generateAuthUrl,
  exchangeCodeForToken,
  verifyShopifyHMAC,
  fetchCustomersWithToken,
} from '../utils/shopifyOAuth.js'

export class AuthController {
  constructor(private prisma: PrismaClient) {}

  /**
   * Initiate Shopify OAuth flow
   */
  async initiateOAuth(
    request: FastifyRequest<{ Querystring: { shop?: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { shop } = request.query
      const shopDomain = shop || process.env.SHOPIFY_SHOP || ''

      if (!shopDomain) {
        return reply.code(400).send({
          error: 'Shop parameter is required. Provide ?shop=yourstore.myshopify.com',
        })
      }

      // Generate authorization URL with required scopes
      const authUrl = generateAuthUrl(shopDomain, [
        'read_customers',
        'read_customer_tags',
      ])

      // Redirect user to Shopify authorization page
      return reply.redirect(authUrl)
    } catch (error: any) {
      request.log.error('OAuth authorization error:', error)
      return reply.code(500).send({
        error: 'Failed to initiate OAuth flow',
        message: error.message,
      })
    }
  }

  /**
   * Handle Shopify OAuth callback
   */
  async handleOAuthCallback(
    request: FastifyRequest<{ Querystring: { code?: string; shop?: string; hmac?: string; state?: string; error?: string } }>,
    reply: FastifyReply
  ) {
    try {
      const query = request.query

      // Check for OAuth errors
      if (query.error) {
        request.log.error('Shopify OAuth error:', query.error)
        return reply.code(400).send({
          error: 'OAuth authorization failed',
          details: query.error,
        })
      }

      // Validate required parameters
      if (!query.code || !query.shop) {
        return reply.code(400).send({
          error: 'Missing required parameters: code and shop are required',
        })
      }

      // Verify HMAC signature (security check)
      if (!verifyShopifyHMAC(query)) {
        request.log.warn('Invalid HMAC signature in OAuth callback')
        return reply.code(401).send({
          error: 'Invalid request signature',
        })
      }

      // Exchange authorization code for access token
      request.log.info(`Exchanging code for token for shop: ${query.shop}`)
      const tokenData = await exchangeCodeForToken(query.shop, query.code)
      const { access_token, shop: shopDomain } = tokenData

      // Fetch customer data using the access token
      request.log.info(`Fetching customers for shop: ${shopDomain}`)
      const customers = await fetchCustomersWithToken(shopDomain, access_token)

      // For this example, we'll use the first customer or shop owner
      const customer = Array.isArray(customers) ? customers[0] : customers

      if (!customer) {
        return reply.code(404).send({
          error: 'No customer data found',
        })
      }

      // Parse customer tags for community assignment
      const tags = parseShopifyTags(customer.tags)
      const communityId = mapCommunityFromTags(tags, {
        prefix: 'community:',
        fallback: 'the_bar_wardrobe',
      })

      // Build username from customer data
      const baseUsername =
        (customer.email?.split('@')[0] || `customer${customer.id}`)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '') || `customer${customer.id}`
      const suffix = String(customer.id).slice(-5)
      const username = `${baseUsername}_${suffix}`

      // Generate avatar color
      const shopifyCustomerId = String(customer.id)
      const avatarColor = generateAvatarColor(shopifyCustomerId)

      // Upsert user in database
      const user = await this.prisma.user.upsert({
        where: { shopifyCustomerId },
        update: {
          firstName: customer.first_name || null,
          lastName: customer.last_name || null,
          email: customer.email,
          username,
          profileImage: customer.image?.src || null,
          avatarColor,
          communityId,
        },
        create: {
          shopifyCustomerId,
          firstName: customer.first_name || null,
          lastName: customer.last_name || null,
          email: customer.email,
          username,
          profileImage: customer.image?.src || null,
          avatarColor,
          communityId,
        },
      })

      // Generate JWT for our app
      const jwt = signJwt({
        userId: user.id,
        shopifyCustomerId: user.shopifyCustomerId,
      })

      // Redirect to frontend with JWT token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      return reply.redirect(
        `${frontendUrl}/auth/callback?token=${encodeURIComponent(jwt)}`
      )
    } catch (error: any) {
      request.log.error('OAuth callback error:', error)
      return reply.code(500).send({
        error: 'OAuth callback failed',
        message: error.message,
      })
    }
  }

  /**
   * Legacy endpoint: Shopify customer login redirect (HMAC-based)
   */
  async handleShopifyRedirect(
    request: FastifyRequest<{ Querystring: Record<string, any> }>,
    reply: FastifyReply
  ) {
    const secret = process.env.SHOPIFY_API_SECRET || ''
    if (!verifyShopify(request.query, secret)) {
      return reply.code(401).send('Invalid Shopify request')
    }

    const { customer_id } = request.query as any
    if (!customer_id) {
      return reply.redirect('/login-required')
    }

    try {
      const customer = await fetchShopifyCustomer(String(customer_id))
      const tags = parseShopifyTags(customer.tags)

      // Map tags -> internal community id (fallback)
      const communityId = mapCommunityFromTags(tags, { prefix: 'community:', fallback: 'the_bar_wardrobe' })

      // Build a stable username (ensure uniqueness if needed)
      const baseUsername =
        (customer.email?.split('@')[0] || `customer${customer.id}`)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '') || `customer${customer.id}`
      const suffix = String(customer.id).slice(-5)
      const username = `${baseUsername}_${suffix}`

      // Upsert user
      const shopifyCustomerId = String(customer.id)
      const avatarColor = generateAvatarColor(shopifyCustomerId)

      const user = await this.prisma.user.upsert({
        where: { shopifyCustomerId },
        update: {
          firstName: customer.first_name || null,
          lastName: customer.last_name || null,
          email: customer.email,
          username,
          profileImage: customer.image?.src || null,
          avatarColor,
          communityId,
        },
        create: {
          shopifyCustomerId,
          firstName: customer.first_name || null,
          lastName: customer.last_name || null,
          email: customer.email,
          username,
          profileImage: customer.image?.src || null,
          avatarColor,
          communityId,
        },
      })

      const token = signJwt({ userId: user.id, shopifyCustomerId: user.shopifyCustomerId })

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      return reply.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`)
    } catch (error: any) {
      request.log.error('Shopify redirect error:', error)
      return reply.code(500).send({ error: 'Failed to process Shopify redirect' })
    }
  }
}




