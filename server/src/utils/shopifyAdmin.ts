type ShopifyCustomer = {
  id: number
  first_name?: string
  last_name?: string
  email: string
  tags?: string // comma-separated
  image?: { src?: string } | null
}

export async function fetchShopifyCustomer(customerId: string): Promise<ShopifyCustomer> {
  const shop = process.env.SHOPIFY_SHOP
  const token = process.env.SHOPIFY_ADMIN_TOKEN
  if (!shop || !token) {
    throw new Error('Missing SHOPIFY_SHOP or SHOPIFY_ADMIN_TOKEN')
  }

  const url = `https://${shop}/admin/api/2024-01/customers/${customerId}.json`
  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to fetch customer (${res.status}): ${text}`)
  }

  const data = (await res.json()) as { customer?: ShopifyCustomer }
  if (!data.customer) throw new Error('Shopify response missing customer')
  return data.customer
}

export function parseShopifyTags(tags: string | undefined): string[] {
  if (!tags) return []
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export function mapCommunityFromTags(tags: string[], opts?: { prefix?: string; fallback?: string }): string {
  const prefix = opts?.prefix || 'community:'
  const fallback = opts?.fallback || 'the_bar_wardrobe'

  for (const tag of tags) {
    if (tag.toLowerCase().startsWith(prefix)) {
      return tag.substring(prefix.length).trim() || fallback
    }
  }
  // If tags directly include a community id, prefer it
  for (const tag of tags) {
    const t = tag.trim()
    if (t) return t // last-resort: first tag
  }
  return fallback
}

export function generateAvatarColor(seed: string): string {
  const colors = [
    '#E9D386', // golden theme default
    '#D4C070',
    '#CBB85F',
    '#BDA84D',
    '#A8943D',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return colors[hash % colors.length]
}








