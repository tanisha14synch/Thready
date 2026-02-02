import { useMainStore } from '~/stores/main'

const AUTH_TOKEN_KEY = 'auth_token'

/**
 * Get the current user: from Pinia (after Shopify OAuth) or fallback to mock localStorage user for demo.
 */
export function getShopifyUser() {
  if (import.meta.client) {
    try {
      const mainStore = useMainStore()
      if (mainStore?.user) {
        return {
          id: mainStore.user.id,
          username: mainStore.user.username || mainStore.user.shop?.replace('.myshopify.com', '') || 'User',
          firstName: mainStore.user.username,
          lastName: '',
          email: null,
          avatar: '/images/avatars/default-avatar.jpg',
        }
      }
    } catch (_) {}
    // Demo fallback
    let user = localStorage.getItem('shopify_user')
    if (!user) {
      user = JSON.stringify({
        id: 'demo-user',
        username: 'User',
        avatar: '/images/avatars/default-avatar.jpg',
        email: 'user@example.com',
      })
      localStorage.setItem('shopify_user', user)
    }
    return JSON.parse(user)
  }
  return null
}

/**
 * Headers for API calls: JWT from localStorage (Authorization: Bearer) or fallback to x-user-id.
 */
export function getShopifyHeaders() {
  if (import.meta.client) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
    const user = getShopifyUser()
    if (user?.id && user.id !== 'demo-user') {
      return { 'x-user-id': user.id }
    }
  }
  return {}
}
