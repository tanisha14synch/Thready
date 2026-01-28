/**
 * Shopify Customer Account API OAuth 2.0 Utilities
 * 
 * This module implements the Customer Account API OAuth flow for customer authentication.
 * This is different from Admin API OAuth - it's specifically for customers to log in.
 * 
 * Reference: https://shopify.dev/docs/apps/auth/customer-accounts
 */

import crypto from 'crypto'

// Environment variables
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || ''
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_API_SECRET || ''
const SHOPIFY_SHOP_DOMAIN = process.env.SHOPIFY_SHOP || ''
const SHOPIFY_SHOP_ID = process.env.SHOPIFY_SHOP_ID || ''
const CALLBACK_URL = process.env.CALLBACK_URL || process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3001/auth/shopify/callback'
const COMMUNITY_URL = process.env.COMMUNITY_URL || process.env.FRONTEND_URL || 'http://localhost:3000'

/**
 * Build Shopify Customer Account API authorization URL
 * Base URL: https://shopify.com/authentication/{SHOP_ID}/login
 * OAuth requires redirect_uri and other params - must match Shopify app settings exactly.
 *
 * @param state - CSRF state for callback validation
 * @param nonce - OIDC nonce for security
 * @returns Full login URL with OAuth params (redirect_uri must be in Shopify Partners)
 */
export function buildCustomerAccountAuthUrl(state: string, nonce: string): string {
  if (!SHOPIFY_CLIENT_ID || !SHOPIFY_SHOP_ID) {
    throw new Error('SHOPIFY_CLIENT_ID and SHOPIFY_SHOP_ID must be configured')
  }
  if (!CALLBACK_URL) {
    throw new Error('CALLBACK_URL or SHOPIFY_REDIRECT_URI must be configured - must match Shopify Partners Redirect URLs')
  }

  const params = new URLSearchParams({
    client_id: SHOPIFY_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: 'openid email customer-account-api:full',
    response_type: 'code',
    state,
    nonce,
  })

  return `https://shopify.com/authentication/${SHOPIFY_SHOP_ID}/login?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 * 
 * Customer Account API uses Shopify.com endpoint, not shop-specific endpoint
 * 
 * @param code - Authorization code from callback
 * @returns Token response with access_token, refresh_token, etc.
 */
export async function exchangeCustomerAccountCodeForToken(code: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
}> {
  if (!SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
    throw new Error('SHOPIFY_CLIENT_ID and SHOPIFY_API_SECRET must be configured')
  }

  // Customer Account API token endpoint is on shopify.com, not shop domain
  const tokenUrl = 'https://shopify.com/authentication/oauth/token'

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: SHOPIFY_CLIENT_ID,
      client_secret: SHOPIFY_CLIENT_SECRET,
      code: code,
      redirect_uri: CALLBACK_URL,
    }).toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Fetch customer profile using Customer Account API GraphQL
 * 
 * @param accessToken - OAuth access token from token exchange
 * @returns Customer profile data
 */
export async function fetchCustomerAccountProfile(accessToken: string): Promise<{
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  defaultAddress?: any
  orders?: any[]
  metafields?: any[]
}> {
  if (!SHOPIFY_SHOP_DOMAIN) {
    throw new Error('SHOPIFY_SHOP_DOMAIN must be configured')
  }

  const query = `
    query {
      customer {
        id
        emailAddress {
          emailAddress
        }
        firstName
        lastName
        phoneNumber {
          phoneNumber
        }
        defaultAddress {
          address1
          address2
          city
          province
          provinceCode
          country
          countryCode
          zip
        }
        orders(first: 10) {
          nodes {
            id
            name
            totalPrice {
              amount
              currencyCode
            }
            processedAt
            fulfillmentStatus
          }
        }
        metafields(first: 10) {
          nodes {
            key
            namespace
            value
            type
          }
        }
      }
    }
  `

  // Customer Account API GraphQL endpoint format
  const graphqlUrl = `https://shopify.com/${SHOPIFY_SHOP_DOMAIN}/account/customer/api/2024-01/graphql`

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch customer profile: ${response.status} - ${error}`)
  }

  const result = await response.json()

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
  }

  const customer = result.data.customer

  // Transform to consistent format
  return {
    id: customer.id,
    email: customer.emailAddress?.emailAddress || '',
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    phone: customer.phoneNumber?.phoneNumber,
    defaultAddress: customer.defaultAddress,
    orders: customer.orders?.nodes || [],
    metafields: customer.metafields?.nodes || [],
  }
}

/**
 * Extract root domain for cookie sharing across subdomains
 * 
 * @param url - Full URL (e.g., https://community.yourdomain.com)
 * @returns Root domain (e.g., .yourdomain.com)
 */
export function extractRootDomain(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname
    const parts = hostname.split('.')
    // Return .domain.com for subdomain cookie sharing
    if (parts.length >= 2) {
      return '.' + parts.slice(-2).join('.')
    }
    return hostname
  } catch {
    return undefined // Let browser handle domain
  }
}

/**
 * Generate random state and nonce for CSRF protection
 */
export function generateStateAndNonce(): { state: string; nonce: string } {
  return {
    state: crypto.randomBytes(32).toString('hex'),
    nonce: crypto.randomBytes(32).toString('hex'),
  }
}
