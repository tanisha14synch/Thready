/**
 * GET /auth?shop=xxx.myshopify.com
 *
 * Canonical login entry is GET /auth/shopify. This route redirects (302) to /auth/shopify
 * so any old links or bookmarks to /auth still work and always use the correct redirect_uri.
 * We do NOT build the Shopify login URL here: only GET /auth/shopify does that with
 * runtimeConfig.private.shopifyRedirectUri (app callback). Building the URL in one place
 * prevents sending an empty or wrong redirect_uri, which would make Shopify redirect to
 * shopify.com/.../account/callback and leave users stuck.
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const shop = (query.shop as string) || ''
  const params = new URLSearchParams()
  if (shop) params.set('shop', shop)
  const qs = params.toString()
  const path = qs ? `/auth/shopify?${qs}` : '/auth/shopify'
  sendRedirect(event, path, 302)
})
