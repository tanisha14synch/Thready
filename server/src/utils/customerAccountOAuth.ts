import crypto from 'crypto'

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || ''
const SHOPIFY_SHOP_ID = process.env.SHOPIFY_SHOP_ID || ''
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || ''

// Determine callback URL based on environment
function getCallbackUrl(): string {
  // First check explicit environment variables
  if (process.env.CALLBACK_URL) return process.env.CALLBACK_URL
  if (process.env.SHOPIFY_REDIRECT_URI) return process.env.SHOPIFY_REDIRECT_URI
  
  // Check if running on Vercel
  if (process.env.VERCEL || process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : (process.env.FRONTEND_URL || process.env.COMMUNITY_URL || 'https://thready-ruby.vercel.app')
    return `${vercelUrl}/auth/shopify/callback`
  }
  
  // Check if we have frontend URL set (production)
  if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')) {
    return `${process.env.FRONTEND_URL}/auth/shopify/callback`
  }
  
  // Default to localhost for local development
  return 'http://localhost:3001/auth/shopify/callback'
}

const CALLBACK_URL = getCallbackUrl()

/**
 * Generate state and nonce for CSRF protection
 */
export function generateStateAndNonce(): { state: string; nonce: string } {
  const state = crypto.randomBytes(32).toString('hex')
  const nonce = crypto.randomBytes(32).toString('hex')
  return { state, nonce }
}

/**
 * Build Customer Account API authorization URL
 */
export function buildCustomerAccountAuthUrl(state: string, nonce: string): string {
  const params = new URLSearchParams({
    client_id: SHOPIFY_CLIENT_ID,
    scope: 'openid email https://api.shopify.com/auth/customer.graphql',
    response_type: 'code',
    redirect_uri: CALLBACK_URL,
    state,
    nonce,
    'grant_options[]': 'per-user',
  })

  return `https://shopify.com/${SHOPIFY_SHOP_ID}/account/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCustomerAccountCodeForToken(code: string): Promise<{
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  id_token?: string
}> {
  const response = await fetch('https://shopify.com/authentication/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: SHOPIFY_CLIENT_ID,
      client_secret: SHOPIFY_API_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: CALLBACK_URL,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Fetch customer profile from Customer Account API
 */
export async function fetchCustomerAccountProfile(accessToken: string): Promise<any> {
  const query = `
    query {
      customer {
        id
        firstName
        lastName
        email
        displayName
        metafields(first: 10) {
          edges {
            node {
              namespace
              key
              value
            }
          }
        }
      }
    }
  `

  const response = await fetch(`https://shopify.com/${SHOPIFY_SHOP_ID}/account/customer/api/unstable/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Customer Account API error: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
  }

  const customer = data.data?.customer
  if (!customer) {
    throw new Error('Customer not found in response')
  }

  // Transform metafields array
  const metafields = customer.metafields?.edges?.map((edge: any) => edge.node) || []

  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    displayName: customer.displayName,
    metafields,
  }
}

/**
 * Extract root domain from URL for cookie domain
 * Example: https://app.example.com -> example.com
 */
export function extractRootDomain(url: string): string {
  if (!url) return ''
  
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    
    // Remove 'www.' prefix if present
    const domain = hostname.replace(/^www\./, '')
    
    // For localhost, return empty string (cookies work without domain)
    if (domain === 'localhost' || domain === '127.0.0.1') {
      return ''
    }
    
    // Extract root domain (e.g., example.com from app.example.com)
    const parts = domain.split('.')
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join('.')}`
    }
    
    return domain
  } catch {
    return ''
  }
}
