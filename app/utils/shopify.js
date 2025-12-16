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
    const user = getShopifyUser()
    if (user) {
        return {
            'x-user-id': user.id
        }
    }
    return {}
}
