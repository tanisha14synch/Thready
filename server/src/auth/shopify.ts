import crypto from 'crypto'

/**
 * Verify Shopify redirect/auth request via HMAC.
 *
 * Shopify commonly uses `hmac` (base16) in query. Your prompt referenced `signature`.
 * We support both for compatibility:
 * - Prefer `hmac` if present, else fall back to `signature`.
 *
 * IMPORTANT: For production, ensure the redirect includes all Shopify-required params
 * and that you validate `shop` as well.
 */
export function verifyShopify(query: Record<string, any>, secret: string): boolean {
  if (!secret) return false

  const provided = (query.hmac || query.signature || '') as string
  if (!provided) return false

  // Remove signature fields from message
  const params: Record<string, any> = { ...query }
  delete params.hmac
  delete params.signature

  // Shopify message format: sorted key=value joined by '&'
  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const computed = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex')

  // timing-safe compare
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, 'utf8'), Buffer.from(provided, 'utf8'))
  } catch {
    return false
  }
}








