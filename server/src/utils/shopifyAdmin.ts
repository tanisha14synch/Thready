/**
 * Shopify Admin API utilities
 * Used for legacy Admin API operations
 */

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || 'thebarwardrobe.myshopify.com'
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || ''

interface ShopifyCustomer {
  id: string
  email: string
  first_name?: string
  last_name?: string
  tags?: string
  image?: {
    src?: string
  }
}

/**
 * Fetch customer from Shopify Admin API
 */
export async function fetchShopifyCustomer(customerId: string): Promise<ShopifyCustomer> {
  if (!SHOPIFY_ADMIN_TOKEN) {
    throw new Error('SHOPIFY_ADMIN_TOKEN is not configured')
  }

  const response = await fetch(
    `https://${SHOPIFY_SHOP}/admin/api/2024-01/customers/${customerId}.json`,
    {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Shopify Admin API error: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.customer
}

/**
 * Parse Shopify tags string into array
 */
export function parseShopifyTags(tags: string | undefined): string[] {
  if (!tags) return []
  return tags.split(',').map((tag) => tag.trim()).filter(Boolean)
}

/**
 * Map community from Shopify tags
 */
export function mapCommunityFromTags(
  tags: string[],
  options: { prefix: string; fallback: string }
): string {
  const { prefix, fallback } = options

  const communityTag = tags.find((tag) => tag.startsWith(prefix))
  if (communityTag) {
    return communityTag.replace(prefix, '')
  }

  return fallback
}

/**
 * Generate avatar color from string (deterministic)
 */
export function generateAvatarColor(str: string): string {
  // Simple hash function
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Generate HSL color
  const hue = Math.abs(hash % 360)
  const saturation = 60 + (Math.abs(hash) % 20) // 60-80%
  const lightness = 45 + (Math.abs(hash) % 15) // 45-60%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}
