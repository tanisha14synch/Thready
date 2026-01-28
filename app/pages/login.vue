<template>
  <div class="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 mt-12">
    <div class="max-w-md w-full">
      <div class="bg-white rounded-lg shadow-lg p-8 text-center">
        <div class="mb-6">
          <img
            src="/logo_golden_wbg.avif"
            alt="Logo"
            class="h-16 w-auto mx-auto object-cover"
          />
        </div>

        <h1 class="text-2xl font-bold text-gray-900 mb-2">Welcome to The Bar Wardrobe</h1>
        <p class="text-gray-600 mb-8">Sign in with your Shopify account to continue</p>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          {{ errorMessage }}
        </div>

        <!-- Login Button -->
        <button
          @click="handleLogin"
          :disabled="isLoading"
          class="w-full px-6 py-3 bg-[#E9D386] hover:bg-[#D4C070] text-black rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span v-if="!isLoading">Sign in with Shopify</span>
          <span v-else class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Redirecting...
          </span>
        </button>

        <p class="mt-6 text-xs text-gray-500">
          By signing in, you agree to our terms of service and privacy policy
        </p>
      </div>

      <!-- Help Text -->
      <div class="mt-6 text-center text-sm text-gray-500">
        <p>Don't have a Shopify account?</p>
        <p class="mt-1">Contact your store administrator to get access.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMainStore } from '~/stores/main'

const route = useRoute()
const router = useRouter()
const mainStore = useMainStore()

const isLoading = ref(false)
const errorMessage = ref('')

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

// Check for error in query params
onMounted(() => {
  const error = route.query.error
  if (error) {
    errorMessage.value = decodeURIComponent(String(error))
  }

  // If already authenticated, redirect to home
  if (mainStore.isAuthenticated) {
    router.push('/')
  }
})

const handleLogin = () => {
  isLoading.value = true
  errorMessage.value = ''
  
  const returnTo = route.query.returnTo || '/'
  const loginUrl = `${apiBase}/auth/shopify/login?returnTo=${encodeURIComponent(String(returnTo))}`
  
  // Redirect to backend login endpoint
  window.location.href = loginUrl
}
</script>
