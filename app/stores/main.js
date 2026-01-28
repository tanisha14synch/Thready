import { defineStore } from 'pinia'

export const useMainStore = defineStore('main', {
  state: () => ({
    selectedSection: 'home', // 'home' | 'popular' | 'community'
    currentCommunity: null,
    isSidebarOpen: false,
    joinedCommunities: [], // ids of communities the user has joined
    user: null,
    authToken: null,
  }),

  getters: {
    isAuthenticated() {
      return !!(this.user && this.authToken)
    },
  },

  actions: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen
    },
    closeSidebar() {
      this.isSidebarOpen = false
    },
    setSection(section) {
      this.selectedSection = section
      this.currentCommunity = null
    },
    setCommunity(name) {
      this.selectedSection = 'community'
      this.currentCommunity = name
    },
    joinCommunity(communityId) {
      if (!communityId) return
      if (!this.joinedCommunities.includes(communityId)) {
        this.joinedCommunities.push(communityId)
      }
    },
    leaveCommunity(communityId) {
      if (!this.joinedCommunities) return
      this.joinedCommunities = this.joinedCommunities.filter((id) => id !== communityId)
    },
    isJoined(communityId) {
      if (!communityId) return false
      if (!Array.isArray(this.joinedCommunities)) {
        this.joinedCommunities = []
        return false
      }
      return this.joinedCommunities.includes(communityId)
    },
    setAuthSession({ user, token, communityId }) {
      if (user) this.user = user
      if (token) this.authToken = token
      if (communityId) this.joinCommunity(communityId)
    },
    logout() {
      this.user = null
      this.authToken = null
    },
    login() {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
      const returnTo = window.location.pathname || '/'
      window.location.href = `${apiBase}/auth/shopify/login?returnTo=${encodeURIComponent(returnTo)}`
    },
  },

  // Persist joinedCommunities so membership stays after reload until user leaves
  persist: {
    paths: ['joinedCommunities', 'user', 'authToken'],
  },
})
