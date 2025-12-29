<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center">
      <div class="text-lg font-semibold text-gray-900 mb-2">Signing you in…</div>
      <div class="text-sm text-gray-500">Please wait.</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMainStore } from '~/stores/main'

const route = useRoute()
const mainStore = useMainStore()

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

onMounted(async () => {
  const token = route.query.token

  if (!token || typeof token !== 'string') {
    return navigateTo('/')
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

    // Redirect to community if mapped, else home
    const communityId = user?.communityId
    if (communityId) return navigateTo(`/community/${communityId}`)
    return navigateTo('/')
  } catch (e) {
    // Token invalid or backend unavailable
    return navigateTo('/')
  }
})
</script>


