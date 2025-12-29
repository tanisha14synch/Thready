import type { FastifyInstance } from 'fastify'
import { verifyShopify } from '../auth/shopify.js'
import { fetchShopifyCustomer, parseShopifyTags, mapCommunityFromTags, generateAvatarColor } from '../utils/shopifyAdmin.js'
import { signJwt } from '../utils/jwt.js'
import {
  generateAuthUrl,
  exchangeCodeForToken,
  verifyShopifyHMAC,
  fetchCustomersWithToken,
} from '../utils/shopifyOAuth.js'

export default async function authRoutes(server: FastifyInstance) {
  /**
   * OAuth 2.0 Step 1: Initiate Shopify OAuth flow
   * 
   * This endpoint redirects users to Shopify's authorization page.
   * Users will grant permissions (read_customers, read_customer_tags) to your app.
   * 
   * Query parameters:
   * - shop (optional): Shop domain. If not provided, uses SHOPIFY_SHOP from env
   * 
   * Example: GET /auth/shopify/authorize?shop=thebarwardrobe.myshopify.com
   */
  server.get('/auth/shopify/authorize', async (request, reply) => {
    try {
      const { shop } = request.query as { shop?: string }
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
      server.log.error('OAuth authorization error:', error)
      return reply.code(500).send({
        error: 'Failed to initiate OAuth flow',
        message: error.message,
      })
    }
  })

  /**
   * OAuth 2.0 Step 2: Handle Shopify callback and exchange code for token
   * 
   * After user authorizes on Shopify, they are redirected back here with:
   * - code: Authorization code to exchange for access token
   * - shop: Shop domain
   * - hmac: HMAC signature for verification
   * - state: State parameter (if provided in step 1)
   * 
   * This endpoint:
   * 1. Verifies HMAC signature
   * 2. Exchanges authorization code for access token
   * 3. Fetches customer data using the access token
   * 4. Creates/updates user in database
   * 5. Generates JWT and redirects to frontend
   */
  server.get('/auth/shopify/callback', async (request, reply) => {
    try {
      const query = request.query as {
        code?: string
        shop?: string
        hmac?: string
        state?: string
        error?: string
      }

      // Check for OAuth errors
      if (query.error) {
        server.log.error('Shopify OAuth error:', query.error)
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
        server.log.warn('Invalid HMAC signature in OAuth callback')
        return reply.code(401).send({
          error: 'Invalid request signature',
        })
      }

      // Step 2: Exchange authorization code for access token
      server.log.info(`Exchanging code for token for shop: ${query.shop}`)
      const tokenData = await exchangeCodeForToken(query.shop, query.code)
      const { access_token, shop: shopDomain } = tokenData

      // Step 3: Fetch customer data using the access token
      // Note: In OAuth flow, we typically get the shop owner/admin user
      // For customer-specific data, you might need to identify which customer logged in
      server.log.info(`Fetching customers for shop: ${shopDomain}`)
      const customers = await fetchCustomersWithToken(shopDomain, access_token)

      // For this example, we'll use the first customer or shop owner
      // In production, you might want to identify the specific logged-in customer
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

      // Step 4: Upsert user in database
      // Store the OAuth access token for future API calls (optional)
      const user = await server.prisma.user.upsert({
        where: { shopifyCustomerId },
        update: {
          firstName: customer.first_name || null,
          lastName: customer.last_name || null,
          email: customer.email,
          username,
          profileImage: customer.image?.src || null,
          avatarColor,
          communityId,
          // Optionally store access token (consider encrypting it)
          // accessToken: access_token,
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
          // Optionally store access token (consider encrypting it)
          // accessToken: access_token,
        },
      })

      // Step 5: Generate JWT for our app
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
      server.log.error('OAuth callback error:', error)
      return reply.code(500).send({
        error: 'OAuth callback failed',
        message: error.message,
      })
    }
  })

  /**
   * Legacy endpoint: Shopify customer login redirect (HMAC-based)
   *
   * Expected query:
   * - customer_id
   * - hmac (or signature, per prompt)
   * - other Shopify params (shop, timestamp, host, etc.)
   */
  server.get('/auth/shopify', async (request, reply) => {
    const secret = process.env.SHOPIFY_API_SECRET || ''
    if (!verifyShopify(request.query as any, secret)) {
      return reply.code(401).send('Invalid Shopify request')
    }

    const { customer_id } = request.query as any
    if (!customer_id) {
      return reply.redirect('/login-required')
    }

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

    const user = await server.prisma.user.upsert({
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
  })

  server.get('/login-required', async () => {
    return { error: 'login_required' }
  })
}



