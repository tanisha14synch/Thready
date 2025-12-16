import { defineStore } from 'pinia'

export const useMainStore = defineStore('main', {
  state: () => ({
    selectedSection: 'home', // 'home' | 'popular' | 'community'
    currentCommunity: null,
    isSidebarOpen: false,
    joinedCommunities: [], // ids of communities the user has joined
  }),

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
  },

  // Persist joinedCommunities so membership stays after reload until user leaves
  persist: {
    paths: ['joinedCommunities'],
  },
})
