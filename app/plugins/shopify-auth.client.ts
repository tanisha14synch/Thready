import { useMainStore } from '~/stores/main'

export default defineNuxtPlugin(async () => {
  if (import.meta.server) return // Only run on client
  
  const mainStore = useMainStore()
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

  // Skip if already have a token
  if (mainStore.authToken) return

  try {
    const res = await $fetch<{
      jwt?: string
      user?: any
      communityId?: string
    }>(`${apiBase}/auth/shopify-user`, {
      method: 'GET',
      headers: {
        // Expect frontend to set the Shopify customer token in localStorage or elsewhere
        'x-shopify-customer-token': typeof localStorage !== 'undefined' ? localStorage.getItem('shopify_customer_token') || '' : '',
      },
    })

    if (res && res.jwt) {
      // @ts-ignore - setAuthSession exists in the store
      mainStore.setAuthSession({
        user: res.user,
        token: res.jwt,
        communityId: res.communityId,
      })
    }
  } catch (err) {
    // Ignore if not logged in on Shopify; app can still run
    console.warn('Shopify auth skipped', err)
  }
})



