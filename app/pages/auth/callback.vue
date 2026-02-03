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
/**
 * Token handoff page: Nitro redirects here with ?token=... after exchanging the Shopify code.
 * We store the token and redirect to /profile so the user lands on their profile (not stuck on Shopify).
 */
const route = useRoute()
const router = useRouter()
const mainStore = useMainStore()

const status = ref('Completing sign in...')
const error = ref(null)

const config = useRuntimeConfig()
const apiBase = () => config.public.apiBase || 'http://localhost:3001'

onMounted(async () => {
  const tokenFromUrl = route.query.token
  if (!tokenFromUrl) {
    error.value = 'Missing token. Please try logging in again.'
    return
  }

  try {
    localStorage.setItem('auth_token', tokenFromUrl)
    mainStore.setAuthSession({ user: null, token: tokenFromUrl })
    const res = await $fetch(`${apiBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenFromUrl}` },
    })
    if (res?.user) {
      mainStore.setAuthSession({ user: res.user, token: tokenFromUrl })
    }
    if (import.meta.client && window.history.replaceState) {
      window.history.replaceState({}, '', route.path)
    }
    await router.replace('/profile')
  } catch (e) {
    error.value = 'Failed to load user. You can try again from home.'
  }
})
</script>
