/**
 * Shopify Customer Accounts (new login) — auth URL, state, and token exchange.
 * Used by server/src/routes/auth.ts.
 */

import crypto from 'crypto'

const SHOP_ID = process.env.SHOPIFY_SHOP_ID || '71806648457'
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || '16398d5a-b94a-4012-89b5-be803e587887'
const SCOPES = 'openid email customer-account-api:full'

const STATE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function getRedirectUri(): string {
  return (
    process.env.SHOPIFY_REDIRECT_URI ||
    process.env.CALLBACK_URL ||
    (process.env.FRONTEND_URL || process.env.COMMUNITY_URL || 'http://localhost:3000') + '/auth/shopify/callback'
  )
}

/**
 * Create state string that encodes shop and can be verified later.
 */
export function createState(shop: string): string {
  const nonce = crypto.randomBytes(16).toString('hex')
  const ts = Date.now()
  const payload = `${shop}:${nonce}:${ts}`
  return Buffer.from(payload).toString('base64url')
}

/**
 * Get shop from state string (for callback when shop is not in query).
 */
export function getShopFromState(state: string): string | null {
  try {
    const payload = Buffer.from(state, 'base64url').toString()
    const parts = payload.split(':')
    if (parts.length >= 1 && parts[0].includes('.myshopify.com')) return parts[0]
    return null
  } catch {
    return null
  }
}

/**
 * Verify state is valid and matches shop (and optionally not expired).
 */
export function verifyState(state: string, shop: string): boolean {
  const decoded = getShopFromState(state)
  if (!decoded || decoded !== shop) return false
  try {
    const payload = Buffer.from(state, 'base64url').toString()
    const parts = payload.split(':')
    const ts = parseInt(parts[2], 10)
    if (Number.isNaN(ts) || Date.now() - ts > STATE_TTL_MS) return false
    return true
  } catch {
    return false
  }
}

/**
 * Build Shopify Customer Accounts login URL. Redirect_uri must match app config.
 */
export function buildCustomerAccountAuthUrl(state: string): string {
  const redirectUri = getRedirectUri()
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
    locale: 'en',
    region_country: 'IN',
  })
  return `https://shopify.com/authentication/${SHOP_ID}/login?${params.toString()}`
}

/**
 * Verify HMAC on callback query (legacy Admin OAuth). Customer Accounts may not send hmac; treat as optional.
 */
export function verifyHmac(query: Record<string, string | undefined>): boolean {
  const hmac = query.hmac
  if (!hmac) return true
  const clientSecret = process.env.SHOPIFY_API_SECRET
  if (!clientSecret) return true
  const sorted = Object.keys(query)
    .filter((k) => k !== 'hmac' && query[k] != null)
    .sort()
    .map((k) => `${k}=${query[k]}`)
    .join('&')
  const computed = crypto.createHmac('sha256', clientSecret).update(sorted).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(computed, 'hex'))
}

/**
 * Exchange authorization code for access token via Customer Accounts token endpoint.
 */
export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ access_token: string; id_token?: string; expires_in?: number }> {
  const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const redirectUri = getRedirectUri()
  const discoveryUrl = `https://${cleanShop}/.well-known/openid-configuration`
  const discoveryRes = await fetch(discoveryUrl)
  if (!discoveryRes.ok) throw new Error(`Discovery failed: ${discoveryRes.status}`)
  const discovery = (await discoveryRes.json()) as { token_endpoint?: string }
  const tokenEndpoint = discovery.token_endpoint
  if (!tokenEndpoint) throw new Error('No token_endpoint in discovery')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    code,
  })

  const tokenRes = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    throw new Error(`Token exchange failed: ${tokenRes.status} ${text}`)
  }
  return (await tokenRes.json()) as { access_token: string; id_token?: string; expires_in?: number }
}
