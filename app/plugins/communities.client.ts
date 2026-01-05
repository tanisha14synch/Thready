import { useCommunityStore } from '~/stores/communities'

export default defineNuxtPlugin(async () => {
  if (import.meta.server) return // Only run on client
  
  const communityStore = useCommunityStore()
  
  // Fetch communities from backend on app initialization
  try {
    await communityStore.fetchCommunities()
  } catch (err) {
    // Silently fail - will use local JSON data as fallback
    console.warn('Failed to fetch communities on init:', err)
  }
})







