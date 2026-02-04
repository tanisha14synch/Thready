/**
 * Nitro route: GET /auth?shop=xxx.myshopify.com
 * Redirects to Shopify Customer Account login so the user can log in.
 * Same-origin /auth works when only Nuxt dev server is running.
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
  const shop = query.shop as string | undefined

  const config = useRuntimeConfig(event) as { shopifyClientId?: string; shopifyShopId?: string; shopifyRedirectUri?: string }
  const clientId = config.shopifyClientId || ''
  const shopId = config.shopifyShopId || ''
  const redirectUri = config.shopifyRedirectUri || ''

  if (!isValidShop(shop)) {
    sendRedirect(event, '/?error=invalid_shop_param', 302)
    return
  }
  if (!clientId || !shopId || !redirectUri) {
    sendRedirect(event, '/?error=auth_config_missing', 302)
    return
  }

  const state = crypto.randomBytes(16).toString('hex')
  const nonce = crypto.randomBytes(16).toString('hex')
  const params = new URLSearchParams({
    client_id: clientId,
    locale: 'en',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    state,
    nonce,
  })
  params.set('region_country', 'IN')

  const authUrl = `https://shopify.com/authentication/${shopId}/login?${params.toString()}`
  sendRedirect(event, authUrl, 302)
})
