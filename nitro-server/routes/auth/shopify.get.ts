/**
 * GET /auth/shopify
 *
 * Nitro login route: dynamically builds the Shopify Customer Account login URL and
 * redirects (302) the browser to Shopify.
 *
 * Why redirect_uri must be our app's callback:
 * - Shopify only redirects to the URL we send as redirect_uri.
 * - If we used shopify.com/.../account/callback, the user would land on Shopify and stay there.
 * - We use runtimeConfig.private.shopifyRedirectUri = https://thready-ruby.vercel.app/auth/shopify/callback
 *   so after login Shopify sends the user back to our Nitro callback route.
 */
import crypto from 'node:crypto'

const SHOP_SUFFIX = '.myshopify.com'
const SCOPES = 'openid,email,customer-account-api:full'

function isValidShop(shop: string | undefined): boolean {
  if (!shop || typeof shop !== 'string') return false
  const s = shop.trim().toLowerCase()
  return s.endsWith(SHOP_SUFFIX) && s.length > SHOP_SUFFIX.length
}

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const shop = (query.shop as string) || undefined

  const config = useRuntimeConfig(event) as {
    shopifyClientId?: string
    shopifyShopId?: string
    shopifyRedirectUri?: string
    shopifyShop?: string
  }
  const clientId = config.shopifyClientId || ''
  const shopId = config.shopifyShopId || ''
  const redirectUri = config.shopifyRedirectUri || 'https://thready-ruby.vercel.app/auth/shopify/callback'

  const shopToUse = shop && isValidShop(shop) ? shop : (config.shopifyShop && isValidShop(config.shopifyShop) ? config.shopifyShop : undefined)
  if (!shopToUse) {
    sendRedirect(event, '/?error=invalid_shop_param', 302)
    return
  }
  if (!clientId || !shopId || !redirectUri) {
    sendRedirect(event, '/?error=auth_config_missing', 302)
    return
  }

  const state = crypto.randomBytes(16).toString('hex')
  const nonce = crypto.randomBytes(16).toString('hex')

  // Shopify Customer Account login query params (each explained):
  const params = new URLSearchParams({
    client_id: clientId,           // Our app's client ID from Shopify Partners
    locale: 'en',                   // Login UI language
    redirect_uri: redirectUri,      // Where Shopify sends the user after login (must be our callback URL)
    response_type: 'code',          // Authorization code flow
    scope: SCOPES,                  // openid, email, customer-account-api
    state,                          // CSRF protection; we could verify it in the callback
    nonce,                          // Replay protection for OpenID
  })
  params.set('region_country', 'IN') // Region/country for login

  const authUrl = `https://shopify.com/authentication/${shopId}/login?${params.toString()}`
  sendRedirect(event, authUrl, 302)
})
