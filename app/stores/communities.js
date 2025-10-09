import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import communityData from '../data/communities.json'

export const useCommunityStore = defineStore('communityStore', () => {
  const communities = ref(communityData)
  const loading = ref(false)
  const error = ref(null)
  
  // Fetch communities from backend
  const fetchCommunities = async () => {
    loading.value = true
    error.value = null
    try {
      // Replace with actual API call when backend is ready
      // const response = await fetch('/api/communities')
      // communities.value = await response.json()
      
      // Using mock data for now
      setTimeout(() => {
        communities.value = communityData
        loading.value = false
      }, 500)
    } catch (err) {
      error.value = err.message || 'Failed to fetch communities'
      loading.value = false
    }
  }
  
  // Fetch a specific community by ID
  const fetchCommunityById = async (communityId) => {
    loading.value = true
    error.value = null
    try {
      // Replace with actual API call when backend is ready
      // const response = await fetch(`/api/communities/${communityId}`)
      // const data = await response.json()
      // Update the community in the store if it exists
      
      // Using mock data for now
      setTimeout(() => {
        // No need to modify the store for mock data
        loading.value = false
      }, 500)
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