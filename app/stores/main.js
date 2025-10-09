import { defineStore } from 'pinia'

export const useMainStore = defineStore('main', {
  state: () => ({
    selectedSection: 'home', // 'home' | 'popular' | 'community'
    currentCommunity: null,
  }),

  actions: {
    setSection(section) {
      this.selectedSection = section
      this.currentCommunity = null
    },
    setCommunity(name) {
      this.selectedSection = 'community'
      this.currentCommunity = name
    },
  },
})
