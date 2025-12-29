// Helper to simulate/get Shopify user session
export function getShopifyUser() {
  if (import.meta.client) {
    // In a real Shopify app, we would verify the session via App Bridge or session token.
    // For development/demo, we simulate a persistent logged-in Shopify user.
    
    let user = localStorage.getItem('shopify_user')
    if (!user) {
        // Create a default user if none exists
        user = JSON.stringify({
            id: 'shopify_user_' + Math.floor(Math.random() * 10000), 
            username: 'ShopifyUser',
            avatar: '/images/avatars/default-avatar.jpg',
            email: 'user@shopify.com'
        })
        localStorage.setItem('shopify_user', user)
    }
    return JSON.parse(user)
  }
  return null
}

export function getShopifyHeaders() {
    // Try to get JWT token from mainStore first (preferred)
    if (import.meta.client) {
        try {
            // Use dynamic require for client-side only
            const { useMainStore } = require('~/stores/main')
            const mainStore = useMainStore()
            if (mainStore.authToken) {
                return {
                    'Authorization': `Bearer ${mainStore.authToken}`,
                    'x-user-id': mainStore.user?.id || mainStore.user?.shopifyCustomerId || ''
                }
            }
        } catch (e) {
            // Store not available yet, fallback to legacy method
        }
    }
    
    // Fallback to legacy method for backward compatibility
    const user = getShopifyUser()
    if (user) {
        return {
            'x-user-id': user.id
        }
    }
    return {}
}



