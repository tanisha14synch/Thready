<template>
  <div class="min-h-screen flex items-center justify-center" style="background-color: var(--background-color);">
    <div class="text-center p-8">
      <p v-if="error" class="text-red-600 mb-4">{{ error }}</p>
      <p v-else class="text-lg" style="color: var(--text-primary);">
        {{ status }}
      </p>
      <NuxtLink v-if="error" to="/" class="mt-4 inline-block underline" style="color: var(--primary-color);">Back to home</NuxtLink>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()
const mainStore = useMainStore()

const status = ref('Completing sign in...')
const error = ref(null)

const config = useRuntimeConfig()
const apiBase = () => config.public.apiBase || 'http://localhost:3001'

onMounted(async () => {
  const query = route.query

  // Case 1: Backend redirected here with token in URL (after exchange)
  const tokenFromUrl = query.token
  if (tokenFromUrl) {
    try {
      localStorage.setItem('auth_token', tokenFromUrl)
      mainStore.setAuthSession({ user: null, token: tokenFromUrl })
      // Fetch user from backend
      const res = await $fetch(`${apiBase()}/auth/me`, {
        headers: { Authorization: `Bearer ${tokenFromUrl}` },
      })
      if (res?.user) {
        mainStore.setAuthSession({ user: res.user, token: tokenFromUrl })
      }
      // Strip token from URL (security) then redirect
      if (import.meta.client && window.history.replaceState) {
        window.history.replaceState({}, '', route.path)
      }
      await router.replace('/profile')
      return
    } catch (e) {
      error.value = 'Failed to load user. You can try again from home.'
      return
    }
  }

  // Case 2: Shopify redirected here with code, shop, hmac, state
  const code = query.code
  const shop = query.shop
  const hmac = query.hmac
  const state = query.state

  if (!code || !shop) {
    error.value = 'Missing authorization data. Please try logging in again.'
    return
  }

  status.value = 'Verifying with server...'
  try {
    const res = await $fetch(`${apiBase()}/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, shop, hmac, state }),
    })

    const jwt = res?.jwt
    const user = res?.user
    if (!jwt) {
      error.value = 'Server did not return a session. Please try again.'
      return
    }

    localStorage.setItem('auth_token', jwt)
    mainStore.setAuthSession({ user, token: jwt })

    const redirectUrl = res?.redirectUrl || '/profile'
    if (redirectUrl.startsWith('http') && redirectUrl.includes('/auth/shopify/callback')) {
      await router.replace('/profile')
    } else {
      await router.replace(redirectUrl.startsWith('http') ? '/profile' : redirectUrl)
    }
  } catch (e) {
    console.error(e)
    error.value = e?.data?.error || 'Sign in failed. Please try again.'
  }
})
</script>
