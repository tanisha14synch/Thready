import { useMainStore } from '~/stores/main'

const AUTH_TOKEN_KEY = 'auth_token'

export default defineNuxtPlugin(async () => {
  if (import.meta.server) return

  const mainStore = useMainStore() as ReturnType<typeof useMainStore> & {
    setAuthSession: (opts: { user?: any; token?: string | null; communityId?: string }) => void
  }
  const config = useRuntimeConfig()
  const apiBase = () => config.public.apiBase || 'http://localhost:3001'

  // Hydrate token from localStorage (in case Pinia persist hasn't loaded yet)
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(AUTH_TOKEN_KEY)
    if (stored && !mainStore.authToken) {
      mainStore.setAuthSession({ token: stored })
    }
  }

  const token = mainStore.authToken
  if (!token) return

  try {
    const res = await $fetch<{ user?: { id: string; shop: string; username: string } }>(`${apiBase()}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (res?.user) {
      mainStore.setAuthSession({ user: res.user, token })
    }
  } catch {
    // Token invalid or expired; clear
    mainStore.setAuthSession({ user: null, token: null })
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }
  }
})
