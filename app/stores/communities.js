import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import communityData from '../data/communities.json'

export const useCommunityStore = defineStore('communityStore', () => {
  const communities = ref(communityData)
  const loading = ref(false)
  const error = ref(null)
  
  const API_URL = 'http://localhost:3000'

  // Fetch communities from backend
  const fetchCommunities = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_URL}/communities`)
      if (!response.ok) throw new Error('Failed to fetch communities')
      const data = await response.json()
      communities.value = data
    } catch (err) {
      // Fallback to bundled JSON so the app keeps working offline/when server is down
      communities.value = communityData
      error.value = err.message || 'Using local communities (server unreachable)'
    } finally {
      loading.value = false
    }
  }
  
  // Fetch a specific community by ID
  const fetchCommunityById = async (communityId) => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_URL}/communities/${communityId}`)
      if (!response.ok) throw new Error('Failed to fetch community')
      const data = await response.json()
      
      // Update or add the community in the store
      const index = communities.value.findIndex(c => c.id === communityId)
      if (index !== -1) {
        communities.value[index] = data
      } else {
        communities.value.push(data)
      }
    } catch (err) {
      // Fallback to bundled JSON entry
      const local = communityData.find(c => c.id === communityId)
      if (local) {
        const index = communities.value.findIndex(c => c.id === communityId)
        if (index !== -1) {
          communities.value[index] = local
        } else {
          communities.value.push(local)
        }
      }
      error.value = err.message || `Using local community ${communityId} (server unreachable)`
    } finally {
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
  const getAllCommunities = computed(() => communities.value)
  
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