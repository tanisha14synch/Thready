import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import communityData from '../data/communities.json'

export const useCommunityStore = defineStore('communityStore', () => {
  const communities = ref(Array.isArray(communityData) ? communityData : [])
  const loading = ref(false)
  const error = ref(null)
  
  const getApiUrl = () =>
    (typeof window !== 'undefined' && window.__API_BASE__ !== undefined)
      ? window.__API_BASE__
      : (import.meta.env?.VITE_API_BASE || import.meta.env?.NUXT_PUBLIC_API_BASE || '')

  // Fetch communities from backend (or same-origin Nitro route when apiBase is empty)
  const fetchCommunities = async () => {
    loading.value = true
    error.value = null
    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/communities`)
      if (!response.ok) throw new Error('Failed to fetch communities')
      const data = await response.json()
      
      // Ensure data is an array before setting
      if (Array.isArray(data) && data.length > 0) {
        communities.value = data
      } else if (Array.isArray(data)) {
        // Empty array from backend - keep local data as fallback
        console.warn('Backend returned empty communities array, keeping local data')
      } else {
        throw new Error('Invalid response format from backend')
      }
      loading.value = false
    } catch (err) {
      error.value = err.message || 'Failed to fetch communities'
      // Keep existing communities (from JSON) if fetch fails
      console.warn('Using local communities data:', err.message)
      loading.value = false
    }
  }
  
  // Fetch a specific community by ID
  const fetchCommunityById = async (communityId) => {
    loading.value = true
    error.value = null
    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/communities/${communityId}`)
      if (!response.ok) throw new Error('Failed to fetch community')
      const data = await response.json()
      
      // Update or add the community in the store
      const index = communities.value.findIndex(c => c.id === communityId)
      if (index !== -1) {
        communities.value[index] = data
      } else {
        communities.value.push(data)
      }
      loading.value = false
    } catch (err) {
      error.value = err.message || `Failed to fetch community ${communityId}`
      loading.value = false
    }
  }
  
  // Get a specific community by ID
  const getCommunityById = (communityId) => {
    return computed(() => 
      communities.value.find((c) => c.id === communityId)
    )
  }
  
  // Get all communities
  const getAllCommunities = computed(() => {
    const comms = communities.value
    return Array.isArray(comms) ? comms : []
  })
  
  return { 
    communities, 
    loading,
    error,
    getCommunityById, 
    getAllCommunities,
    fetchCommunities,
    fetchCommunityById
  }
})