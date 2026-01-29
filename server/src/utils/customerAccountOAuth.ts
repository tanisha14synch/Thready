/**
 * Shopify Customer Account API OAuth 2.0 utilities.
 * Shop: The Bar Wardrobe — https://thebarwardrobe.com
 */

import crypto from 'crypto'

const SHOPIFY_SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN || 'thebarwardrobe.myshopify.com'
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || `https://${SHOPIFY_SHOP_DOMAIN}`
const CALLBACK_URL = process.env.CALLBACK_URL || process.env.SHOPIFY_REDIRECT_URI || ''

export function generateStateAndNonce(): { state: string; nonce: string } {
  return {
    state: crypto.randomBytes(16).toString('hex'),
    nonce: crypto.randomBytes(16).toString('hex'),
  }
}

export function buildCustomerAccountAuthUrl(state: string, nonce: string): string {
  const clientId = process.env.SHOPIFY_CLIENT_ID
  const redirectUri = CALLBACK_URL

  if (!clientId || !redirectUri) {
    throw new Error('SHOPIFY_CLIENT_ID and CALLBACK_URL (or SHOPIFY_REDIRECT_URI) must be set')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid email https://api.shopify.com/auth/customer-account-api:full',
    response_type: 'code',
    state,
    nonce,
  })

  const authorizeHost = SHOPIFY_STORE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return `https://${authorizeHost}/authentication/oauth/authorize?${params.toString()}`
}

export async function exchangeCustomerAccountCodeForToken(code: string): Promise<{
  access_token: string
  token_type?: string
  expires_in?: number
  refresh_token?: string
}> {
  const clientId = process.env.SHOPIFY_CLIENT_ID
  const clientSecret = process.env.SHOPIFY_API_SECRET
  const redirectUri = CALLBACK_URL

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('SHOPIFY_CLIENT_ID, SHOPIFY_API_SECRET, and CALLBACK_URL must be set')
  }

  const response = await fetch('https://shopify.com/authentication/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }).toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Token exchange failed: ${text}`)
  }

  return response.json() as Promise<{
    access_token: string
    token_type?: string
    expires_in?: number
    refresh_token?: string
  }>
}

export interface CustomerAccountProfile {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  defaultAddress?: unknown
  orders?: unknown[]
  metafields?: Array<{ namespace: string; key: string; value: string; type?: string }>
}

export async function fetchCustomerAccountProfile(
  accessToken: string
): Promise<CustomerAccountProfile> {
  const shopDomain = SHOPIFY_SHOP_DOMAIN
  const query = `
    query {
      customer {
        id
        emailAddress { emailAddress }
        firstName
        lastName
        phoneNumber { phoneNumber }
        defaultAddress {
          address1 address2 city province provinceCode country countryCode zip
        }
        orders(first: 10) {
          nodes {
            id name totalPrice { amount currencyCode } processedAt fulfillmentStatus
          }
        }
        metafields(first: 10) {
          nodes { key namespace value type }
        }
      }
    }
  `

  const url = `https://shopify.com/${shopDomain}/account/customer/api/2024-01/graphql`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Customer Account API error: ${text}`)
  }

  const result = (await response.json()) as {
    data?: { customer?: Record<string, unknown> }
    errors?: Array<{ message: string }>
  }

  if (result.errors?.length) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
  }

  const customer = result.data?.customer
  if (!customer) {
    throw new Error('No customer data in response')
  }

  const c = customer as {
    id: string
    emailAddress?: { emailAddress?: string }
    firstName?: string
    lastName?: string
    phoneNumber?: { phoneNumber?: string }
    defaultAddress?: unknown
    orders?: { nodes?: unknown[] }
    metafields?: {
      nodes?: Array<{ namespace: string; key: string; value: string; type?: string }>
    }
  }

  return {
    id: c.id,
    email: c.emailAddress?.emailAddress,
    firstName: c.firstName ?? undefined,
    lastName: c.lastName ?? undefined,
    phone: c.phoneNumber?.phoneNumber,
    defaultAddress: c.defaultAddress,
    orders: c.orders?.nodes,
    metafields: c.metafields?.nodes,
  }
}

export function extractRootDomain(url: string): string | undefined {
  if (!url || !url.startsWith('http')) return undefined
  try {
    const hostname = new URL(url).hostname
    const parts = hostname.split('.')
    if (parts.length >= 2) {
      return '.' + parts.slice(-2).join('.')
    }
    return hostname
  } catch {
    return undefined
  }
}
