import type { PrismaClient } from '@prisma/client'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyShopify } from '../auth/shopify.js'
import { fetchShopifyCustomer, parseShopifyTags, mapCommunityFromTags, generateAvatarColor } from '../utils/shopifyAdmin.js'
import { signJwt, signSessionJwt, verifyJwt, type SessionJwtPayload } from '../utils/jwt.js'
import {
  buildCustomerAccountAuthUrl,
  exchangeCustomerAccountCodeForToken,
  fetchCustomerAccountProfile,
  extractRootDomain,
  generateStateAndNonce,
} from '../utils/customerAccountOAuth.js'
import { setState, getState, deleteState } from '../utils/stateStore.js'
import { getCustomerProfile } from '../services/customerAccountService.js'

export class AuthController {
  constructor(private prisma: PrismaClient) {}

  /**
   * GET /auth/shopify/login
   * Initiates Customer Account API OAuth flow - redirects to Shopify
   * 
   * According to master plan: Customer Account API OAuth 2.0 flow
   */
  async initiateCustomerAccountOAuth(
    request: FastifyRequest<{ Querystring: { returnTo?: string } }>,
    reply: FastifyReply
  ) {
    try {
      // Generate CSRF protection state and nonce
      const { state, nonce } = generateStateAndNonce()
      const returnTo = request.query.returnTo || '/'

      // Store state for validation (expires in 10 minutes)
      setState(state, {
        nonce,
        createdAt: Date.now(),
        returnTo,
      })

      // Build Shopify Customer Account API authorization URL
      const authUrl = buildCustomerAccountAuthUrl(state, nonce)

      request.log.info({ state }, 'Initiating Customer Account API OAuth flow')

      return reply.redirect(authUrl)
    } catch (error: any) {
      request.log.error('OAuth authorization error:', error)
      const frontendUrl = process.env.FRONTEND_URL || process.env.COMMUNITY_URL || 'http://localhost:3000'
      return reply.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message || 'Failed to initiate OAuth flow')}`)
    }
  }

  /**
   * GET /auth/shopify/callback
   * Handles Customer Account API OAuth callback from Shopify
   * 
   * According to master plan: Validates state, exchanges code for token,
   * fetches customer profile, creates session cookie
   */
  async handleCustomerAccountCallback(
    request: FastifyRequest<{ Querystring: { code?: string; state?: string; error?: string; error_description?: string } }>,
    reply: FastifyReply
  ) {
    const { code, state, error, error_description } = request.query
    const frontendUrl = process.env.FRONTEND_URL || process.env.COMMUNITY_URL || 'http://localhost:3000'

    // Handle OAuth errors
    if (error) {
      request.log.error({ error, error_description }, 'OAuth error from Shopify')
      return reply.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error_description || error)}`)
    }

    // Validate required parameters
    if (!code || !state) {
      request.log.error('Missing code or state parameter')
      return reply.redirect(`${frontendUrl}/login?error=invalid_request`)
    }

    // Validate state (CSRF protection)
    const storedState = getState(state)
    if (!storedState) {
      request.log.error({ state }, 'Invalid or expired state parameter')
      return reply.redirect(`${frontendUrl}/login?error=invalid_state`)
    }

    // Remove used state
    deleteState(state)

    // Check state expiry (10 minutes)
    if (Date.now() - storedState.createdAt > 10 * 60 * 1000) {
      request.log.error('State parameter expired')
      return reply.redirect(`${frontendUrl}/login?error=state_expired`)
    }

    try {
      // Exchange authorization code for tokens
      const tokens = await exchangeCustomerAccountCodeForToken(code)

      // Fetch customer profile from Shopify Customer Account API
      const customer = await getCustomerProfile(tokens.access_token)

      // Extract Shopify customer ID from GID format (gid://shopify/Customer/123456789)
      const shopifyCustomerId = customer.id.replace('gid://shopify/Customer/', '')

      // Parse customer tags for community assignment (if available via metafields)
      const tags = customer.metafields?.find((m: any) => m.namespace === 'customer' && m.key === 'tags')?.value || ''
      const parsedTags = parseShopifyTags(tags)
      const communityId = mapCommunityFromTags(parsedTags, {
        prefix: 'community:',
        fallback: 'the_bar_wardrobe',
      })

      // Build username from customer data
      const baseUsername =
        (customer.email?.split('@')[0] || `customer${shopifyCustomerId}`)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '') || `customer${shopifyCustomerId}`
      const suffix = String(shopifyCustomerId).slice(-5)
      const username = `${baseUsername}_${suffix}`

      // Generate avatar color
      const avatarColor = generateAvatarColor(shopifyCustomerId)

      // Upsert user in database
      const user = await this.prisma.user.upsert({
        where: { shopifyCustomerId },
        update: {
          firstName: customer.firstName || null,
          lastName: customer.lastName || null,
          email: customer.email,
          username,
          avatarColor,
          communityId,
        },
        create: {
          shopifyCustomerId,
          firstName: customer.firstName || null,
          lastName: customer.lastName || null,
          email: customer.email,
          username,
          avatarColor,
          communityId,
        },
      })

      // Create session JWT (for cookie)
      const displayName = `${customer.firstName} ${customer.lastName}`.trim() || customer.email
      const sessionToken = signSessionJwt({
        customerId: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        displayName,
        shopifyAccessToken: tokens.access_token, // Store if needed for API calls
      })

      // Set HTTP-only session cookie
      const cookieDomain = extractRootDomain(process.env.COMMUNITY_URL || process.env.FRONTEND_URL || '')
      reply.setCookie('community_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: cookieDomain,
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      })

      // Also generate app JWT for backward compatibility (query param)
      const appJwt = signJwt({
        userId: user.id,
        shopifyCustomerId: user.shopifyCustomerId,
      })

      request.log.info({ customerId: customer.id, userId: user.id }, 'User authenticated successfully')

      // Redirect to frontend callback page with token and returnTo
      // The callback page will process the token and redirect to returnTo
      const returnTo = storedState.returnTo || '/'
      return reply.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(appJwt)}&returnTo=${encodeURIComponent(returnTo)}`)
    } catch (err: any) {
      request.log.error({ err }, 'Failed to complete OAuth flow')
      return reply.redirect(`${frontendUrl}/login?error=authentication_failed`)
    }
  }

  /**
   * GET /auth/me
   * Returns current authenticated user from session cookie
   * 
   * According to master plan: Returns user data from JWT session cookie
   */
  async getCurrentSession(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const token = request.cookies.community_session

    if (!token) {
      return reply.code(401).send({
        authenticated: false,
        error: 'Not authenticated',
      })
    }

    try {
      const user = verifyJwt<SessionJwtPayload>(token)
      if (!user) {
        // Clear invalid cookie
        const cookieDomain = extractRootDomain(process.env.COMMUNITY_URL || process.env.FRONTEND_URL || '')
        reply.clearCookie('community_session', {
          domain: cookieDomain,
          path: '/',
        })

        return reply.code(401).send({
          authenticated: false,
          error: 'Invalid or expired session',
        })
      }

      return {
        authenticated: true,
        user: {
          customerId: user.customerId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
        },
      }
    } catch (err: any) {
      // Clear invalid cookie
      const cookieDomain = extractRootDomain(process.env.COMMUNITY_URL || process.env.FRONTEND_URL || '')
      reply.clearCookie('community_session', {
        domain: cookieDomain,
        path: '/',
      })

      return reply.code(401).send({
        authenticated: false,
        error: 'Invalid or expired session',
      })
    }
  }

  /**
   * POST /auth/logout
   * Clears session cookie
   * 
   * According to master plan: Clears session and optionally revokes token
   */
  async logout(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    // Clear session cookie
    const cookieDomain = extractRootDomain(process.env.COMMUNITY_URL || process.env.FRONTEND_URL || '')
    reply.clearCookie('community_session', {
      domain: cookieDomain,
      path: '/',
    })

    request.log.info('User logged out')

    return { success: true, message: 'Logged out successfully' }
  }

  /**
   * POST /auth/refresh
   * Refreshes the session token
   * 
   * According to master plan: Refreshes session token with new expiry
   */
  async refreshSession(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const token = request.cookies.community_session

    if (!token) {
      return reply.code(401).send({ error: 'No session to refresh' })
    }

    try {
      const user = verifyJwt<SessionJwtPayload>(token)
      if (!user) {
        const cookieDomain = extractRootDomain(process.env.COMMUNITY_URL || process.env.FRONTEND_URL || '')
        reply.clearCookie('community_session', {
          domain: cookieDomain,
          path: '/',
        })
        return reply.code(401).send({ error: 'Invalid session' })
      }

      // Issue new token with refreshed expiry
      const newToken = signSessionJwt({
        customerId: user.customerId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        shopifyAccessToken: user.shopifyAccessToken,
      })

      const cookieDomain = extractRootDomain(process.env.COMMUNITY_URL || process.env.FRONTEND_URL || '')
      reply.setCookie('community_session', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: cookieDomain,
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })

      return { success: true, message: 'Session refreshed' }
    } catch (err: any) {
      const cookieDomain = extractRootDomain(process.env.COMMUNITY_URL || process.env.FRONTEND_URL || '')
      reply.clearCookie('community_session', {
        domain: cookieDomain,
        path: '/',
      })

      return reply.code(401).send({ error: 'Invalid session' })
    }
  }

  // ===========================================
  // LEGACY ENDPOINTS (Admin API OAuth)
  // ===========================================

  /**
   * Initiate Shopify Admin API OAuth flow (legacy)
   */
  async initiateOAuth(
    request: FastifyRequest<{ Querystring: { shop?: string } }>,
    reply: FastifyReply
  ) {
    // Redirect to Customer Account API flow
    // Convert request type to match initiateCustomerAccountOAuth
    const convertedRequest = request as FastifyRequest<{ Querystring: { returnTo?: string } }>
    return this.initiateCustomerAccountOAuth(convertedRequest, reply)
  }

  /**
   * Handle Shopify Admin API OAuth callback (legacy)
   */
  async handleOAuthCallback(
    request: FastifyRequest<{ Querystring: { code?: string; shop?: string; hmac?: string; state?: string; error?: string } }>,
    reply: FastifyReply
  ) {
    // Try Customer Account API callback first
    if (request.query.code && request.query.state && !request.query.shop) {
      return this.handleCustomerAccountCallback(request, reply)
    }

    // Otherwise, handle as legacy Admin API callback
    try {
      const query = request.query

      if (query.error) {
        request.log.error({ error: query.error }, 'Shopify OAuth error')
        return reply.code(400).send({
          error: 'OAuth authorization failed',
          details: query.error,
        })
      }

      if (!query.code || !query.shop) {
        return reply.code(400).send({
          error: 'Missing required parameters: code and shop are required',
        })
      }

      // Legacy Admin API flow would continue here...
      // For now, redirect to Customer Account API flow
      const convertedRequest = request as FastifyRequest<{ Querystring: { returnTo?: string } }>
      return this.initiateCustomerAccountOAuth(convertedRequest, reply)
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

      const communityId = mapCommunityFromTags(tags, { prefix: 'community:', fallback: 'the_bar_wardrobe' })

      const baseUsername =
        (customer.email?.split('@')[0] || `customer${customer.id}`)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '') || `customer${customer.id}`
      const suffix = String(customer.id).slice(-5)
      const username = `${baseUsername}_${suffix}`

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
