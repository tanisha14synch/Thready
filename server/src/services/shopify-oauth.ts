import crypto from 'crypto'
import { SHOPIFY_SCOPES } from '../lib/constants.js'

const clientId = process.env.SHOPIFY_CLIENT_ID!
const clientSecret = process.env.SHOPIFY_API_SECRET!
const redirectUri = process.env.SHOPIFY_REDIRECT_URI || process.env.CALLBACK_URL!

/** Shopify Customer Account Shop ID (for shopify.com/authentication/{id}/login). */
const shopId = process.env.SHOPIFY_SHOP_ID || ''

/**
 * Build the Shopify Customer Account login URL.
 * User is redirected to https://shopify.com/authentication/{shopId}/login (Customer Account flow).
 */
export function buildCustomerAccountAuthUrl(state: string): string {
  if (!shopId) {
    throw new Error('SHOPIFY_SHOP_ID is required for Customer Account login')
  }
  const nonce = crypto.randomBytes(16).toString('hex')
  const params = new URLSearchParams({
    client_id: clientId,
    locale: 'en',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SHOPIFY_SCOPES,
    state,
    nonce,
  })
  const regionCountry = process.env.SHOPIFY_REGION_COUNTRY || 'IN'
  params.set('region_country', regionCountry)
  return `https://shopify.com/authentication/${shopId}/login?${params.toString()}`
}

/**
 * Build the Shopify Admin API OAuth authorization URL (legacy).
 * User is redirected here to approve the app.
 */
export function buildAuthUrl(shop: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
  })
  const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return `https://${cleanShop}/admin/oauth/authorize?${params.toString()}`
}

/**
 * Verify that the callback request came from Shopify using HMAC.
 * Query must contain: hmac, and all other params (except hmac) are used to compute HMAC.
 */
export function verifyHmac(query: Record<string, string | undefined>): boolean {
  const hmac = query.hmac
  if (!hmac || !clientSecret) return false
  const sorted = Object.keys(query)
    .filter((k) => k !== 'hmac' && query[k] != null)
    .sort()
    .map((k) => `${k}=${query[k]}`)
    .join('&')
  const computed = crypto.createHmac('sha256', clientSecret).update(sorted).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(computed, 'hex'))
}

/**
 * Generate a state string that we can verify on callback (signed so we don't need to store it).
 */
export function createState(shop: string): string {
  const nonce = crypto.randomBytes(16).toString('hex')
  const payload = `${shop}:${nonce}:${Date.now()}`
  const signature = crypto.createHmac('sha256', clientSecret).update(payload).digest('hex')
  return Buffer.from(JSON.stringify({ p: payload, s: signature })).toString('base64url')
}

export function verifyState(state: string, shop: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString()) as { p: string; s: string }
    const signature = crypto.createHmac('sha256', clientSecret).update(decoded.p).digest('hex')
    if (signature !== decoded.s) return false
    const [stateShop] = decoded.p.split(':')
    return stateShop === shop
  } catch {
    return false
  }
}

/** Decode shop from our signed state (for Customer Account callback when shop is not in query). */
export function getShopFromState(state: string): string | null {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString()) as { p: string; s: string }
    const signature = crypto.createHmac('sha256', clientSecret).update(decoded.p).digest('hex')
    if (signature !== decoded.s) return null
    const [stateShop] = decoded.p.split(':')
    return stateShop || null
  } catch {
    return null
  }
}

/**
 * Exchange the authorization code for an access token.
 */
export async function exchangeCodeForToken(shop: string, code: string): Promise<{ access_token: string; scope?: string }> {
  const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const url = `https://${cleanShop}/admin/oauth/access_token`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Shopify token exchange failed: ${res.status} ${text}`)
  }
  return (await res.json()) as { access_token: string; scope?: string }
}
