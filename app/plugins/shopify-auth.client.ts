import { useMainStore } from '~/stores/main'

export default defineNuxtPlugin(async () => {
  if (import.meta.server) return // Only run on client
  
  const mainStore = useMainStore()
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

  // If we already have a token but no user, hydrate user profile.
  if (!mainStore.authToken) return
  if (mainStore.user) return

  try {
    const user = await $fetch(`${apiBase}/api/user/me`, {
      headers: {
        Authorization: `Bearer ${mainStore.authToken}`,
      },
    })
    // @ts-ignore - store is JS; method exists at runtime
    mainStore.setAuthSession({ user })
  } catch (err) {
    // Token invalid / backend unreachable – keep app usable without auth
    console.warn('Auth hydrate skipped', err)
  }
})



