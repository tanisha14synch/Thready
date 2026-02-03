/**
 * GET /auth/shopify/callback
 *
 * Shopify sends the user here after they log in (this is the redirect_uri we sent in the login URL).
 *
 * Why the app callback is required:
 * - Shopify cannot redirect directly to /profile: OAuth only redirects to redirect_uri with a ?code=...
 * - We must receive the code on our server, exchange it for tokens, then send the user to /profile.
 *
 * Why we cannot redirect directly from Shopify to /profile:
 * - The user would have no session (no JWT). We need to exchange the code for an access token, sign a JWT,
 *   and hand it to the client; then the client stores it and navigates to /profile.
 *
 * Redirect chain end-to-end:
 * 1. Frontend → /auth/shopify → (Nitro redirects to) Shopify Login
 * 2. Shopify → /auth/shopify/callback?code=... (this route)
 * 3. This route: exchange code for token, sign JWT, redirect 302 to /auth/callback?token=...
 * 4. Vue page /auth/callback: store token, then redirect to /profile (mandatory so user is not stuck on Shopify).
 */
import { getRequestURL } from 'h3'
import * as jose from 'jose'

const SHOP_SUFFIX = '.myshopify.com'

function isValidShop(shop: string | undefined): boolean {
  if (!shop || typeof shop !== 'string') return false
  const s = shop.trim().toLowerCase()
  return s.endsWith(SHOP_SUFFIX) && s.length > SHOP_SUFFIX.length
}

/** Real token exchange: POST to shop's admin/oauth/access_token. For Customer Account API, discovery (.well-known) could be used here. */
async function exchangeCodeForToken(
  shop: string,
  code: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string }> {
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
  return (await res.json()) as { access_token: string }
}

async function signJwt(payload: { shop: string; shopId: string }, secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret)
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string | undefined
  const token = query.token as string | undefined
  const shopQuery = query.shop as string | undefined
  const state = query.state as string | undefined

  // If we have token but no code, this is a follow-up request (e.g. client landed on .../callback?token=...).
  // Redirect to /auth/callback so the Vue page can store the token and redirect to /profile.
  if (!code) {
    if (token) {
      sendRedirect(event, `/auth/callback?token=${encodeURIComponent(token)}`, 302)
      return
    }
    sendRedirect(event, '/?error=missing_code', 302)
    return
  }

  const config = useRuntimeConfig(event) as {
    shopifyApiKey?: string
    shopifyApiSecret?: string
    shopifyShop?: string
    shopifyShopId?: string
    jwtSecret?: string
  }
  const clientId = config.shopifyClientId || ''
  const clientSecret = config.shopifyApiSecret || ''
  const shopFromConfig = config.shopifyShop || 'thebarwardrobe.myshopify.com'
  const shopId = config.shopifyShopId || ''
  const jwtSecret = config.jwtSecret || ''

  const shop = shopQuery && isValidShop(shopQuery) ? shopQuery : (isValidShop(shopFromConfig) ? shopFromConfig : undefined)
  if (!shop) {
    sendRedirect(event, '/?error=invalid_shop', 302)
    return
  }
  if (!clientId || !clientSecret || !jwtSecret) {
    sendRedirect(event, '/?error=auth_config_missing', 302)
    return
  }

  try {
    const { access_token: _accessToken } = await exchangeCodeForToken(shop, code, clientId, clientSecret)
    const jwt = await signJwt({ shop, shopId }, jwtSecret)
    const url = getRequestURL(event)
    const origin = url.origin
    // Redirect to token-handoff page; that page stores the token and redirects to /profile.
    // Redirect to /profile is mandatory so the user is not stuck on Shopify or on our callback URL.
    const redirectTo = `${origin}/auth/callback?token=${encodeURIComponent(jwt)}`
    sendRedirect(event, redirectTo, 302)
  } catch (err) {
    console.error('[auth/shopify/callback] token exchange failed', err)
    sendRedirect(event, '/?error=token_exchange_failed', 302)
  }
})
