<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center">
      <div v-if="!error" class="text-lg font-semibold text-gray-900 mb-2">Signing you in…</div>
      <div v-if="!error" class="text-sm text-gray-500">Please wait.</div>
      
      <div v-if="error" class="max-w-md mx-auto">
        <div class="text-lg font-semibold text-red-600 mb-2">Authentication Failed</div>
        <div class="text-sm text-gray-600 mb-4">{{ error }}</div>
        <button
          @click="retryLogin"
          class="px-6 py-2 bg-[#E9D386] hover:bg-[#D4C070] text-black rounded-full font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMainStore } from '~/stores/main'

const route = useRoute()
const mainStore = useMainStore()
const error = ref('')

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

onMounted(async () => {
  const token = route.query.token
  const errorParam = route.query.error
  const returnTo = route.query.returnTo || '/'

  // Check for error from OAuth flow
  if (errorParam) {
    error.value = decodeURIComponent(String(errorParam))
    return
  }

  if (!token || typeof token !== 'string') {
    error.value = 'No authentication token received'
    return
  }

  // Save token
  mainStore.setAuthSession({ token })

  // Fetch user profile
  try {
    const user = await $fetch(`${apiBase}/api/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    mainStore.setAuthSession({ user })

    // Redirect to returnTo destination, or community if mapped, else home
    if (returnTo && returnTo !== '/') {
      return navigateTo(returnTo)
    }
    const communityId = user?.communityId
    if (communityId) return navigateTo(`/community/${communityId}`)
    return navigateTo('/')
  } catch (e) {
    // Token invalid or backend unavailable
    error.value = e?.message || 'Failed to authenticate. Please try again.'
    mainStore.logout()
  }
})

const retryLogin = () => {
  navigateTo('/login')
}
</script>


