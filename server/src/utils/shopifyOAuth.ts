/**
 * Shopify OAuth 2.0 Authorization Code Flow Utilities
 * 
 * This module handles the complete OAuth 2.0 flow:
 * 1. Generate authorization URL
 * 2. Exchange authorization code for access token
 * 3. Fetch customer data using access token
 */

import crypto from 'crypto'

// Shopify OAuth configuration
const SHOPIFY_API_KEY = process.env.SHOPIFY_CLIENT_ID || ''
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || ''
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || ''
const REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3001/auth/shopify/callback'

/**
 * Step 1: Generate the authorization URL to redirect users to Shopify
 * 
 * @param shop - The shop domain (e.g., "thebarwardrobe.myshopify.com")
 * @param scopes - Array of permission scopes (e.g., ["read_customers", "read_customer_tags"])
 * @param state - Optional state parameter for CSRF protection
 * @returns The full Shopify OAuth authorization URL
 */
export function generateAuthUrl(
  shop: string,
  scopes: string[] = ['read_customers', 'read_customer_tags'],
  state?: string
): string {
  if (!SHOPIFY_API_KEY) {
    throw new Error('SHOPIFY_CLIENT_ID is not configured in environment variables')
  }

  // Generate a random state if not provided (for CSRF protection)
  const stateParam = state || crypto.randomBytes(16).toString('hex')

  // Build the authorization URL
  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: scopes.join(','),
    redirect_uri: REDIRECT_URI,
    state: stateParam,
  })

  // Ensure shop domain format is correct
  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`
  const authUrl = `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`

  return authUrl
}

/**
 * Step 2: Exchange authorization code for access token
 * 
 * After Shopify redirects back with an authorization code, we exchange it
 * for an access token that can be used to make API calls.
 * 
 * @param shop - The shop domain
 * @param code - The authorization code from Shopify callback
 * @returns Access token and associated shop information
 */
export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ access_token: string; scope: string; shop: string }> {
  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
    throw new Error('SHOPIFY_CLIENT_ID and SHOPIFY_API_SECRET must be configured')
  }

  // Ensure shop domain format is correct
  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`
  const tokenUrl = `https://${shopDomain}/admin/oauth/access_token`

  // Prepare the request body
  const body = {
    client_id: SHOPIFY_API_KEY,
    client_secret: SHOPIFY_API_SECRET,
    code,
  }

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to exchange code for token: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    throw new Error(`Token exchange failed: ${error.message}`)
  }
}

/**
 * Step 3: Verify HMAC signature from Shopify callback
 * 
 * Shopify includes an HMAC parameter in the callback query string
 * to verify the request authenticity.
 * 
 * @param query - Query parameters from the callback URL
 * @returns True if HMAC is valid, false otherwise
 */
export function verifyShopifyHMAC(query: Record<string, any>): boolean {
  if (!SHOPIFY_API_SECRET) {
    throw new Error('SHOPIFY_API_SECRET is not configured')
  }

  const hmac = query.hmac as string
  if (!hmac) {
    return false
  }

  // Remove hmac and signature from params for verification
  const params: Record<string, any> = { ...query }
  delete params.hmac
  delete params.signature

  // Sort keys and create message string (Shopify's format)
  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  // Calculate HMAC
  const computedHmac = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex')

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHmac, 'utf8'),
      Buffer.from(hmac, 'utf8')
    )
  } catch {
    return false
  }
}

/**
 * Step 4: Fetch customer data using the access token
 * 
 * Once we have an access token, we can use it to fetch customer information
 * from the Shopify Admin API.
 * 
 * @param shop - The shop domain
 * @param accessToken - The OAuth access token
 * @param customerId - Optional customer ID. If not provided, fetches all customers
 * @returns Customer data from Shopify
 */
export async function fetchCustomersWithToken(
  shop: string,
  accessToken: string,
  customerId?: string
): Promise<any> {
  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`
  
  // Build API URL - fetch specific customer or list all
  const apiUrl = customerId
    ? `https://${shopDomain}/admin/api/2024-01/customers/${customerId}.json`
    : `https://${shopDomain}/admin/api/2024-01/customers.json`

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch customers: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Return customer object or array of customers
    return customerId ? data.customer : data.customers
  } catch (error: any) {
    throw new Error(`Failed to fetch customers: ${error.message}`)
  }
}

/**
 * Fetch the currently authenticated shop owner/admin user
 * 
 * @param shop - The shop domain
 * @param accessToken - The OAuth access token
 * @returns Shop owner/admin user information
 */
export async function fetchShopOwner(shop: string, accessToken: string): Promise<any> {
  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`
  const apiUrl = `https://${shopDomain}/admin/api/2024-01/users.json`

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch shop owner: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    // Return the first user (typically the shop owner)
    return data.users?.[0] || null
  } catch (error: any) {
    throw new Error(`Failed to fetch shop owner: ${error.message}`)
  }
}






