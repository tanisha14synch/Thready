<template>
  <header class="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 flex items-center justify-between h-12">
      <!-- Left: Logo & Search -->
      <div class="flex items-center gap-4 flex-1">
        <button class="md:hidden" @click="toggleSidebar">
          <Menu class="w-6 h-6 text-gray-600" />
        </button>
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <span class="text-white font-bold text-xs">TBW</span>
          </div>
          <h1 class="font-bold text-xl text-gray-900 hidden sm:block">thebarwardrobe</h1>
        </NuxtLink>
        <div class="hidden md:flex flex-1 max-w-xl relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search thebarwardrobe"
            class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-blue-500"
            @input="handleSearch"
            @keyup.enter="handleSearchEnter"
            @focus="showSearchResults = true"
          />
          <!-- Search Results Dropdown -->
          <div
            v-if="showSearchResults && searchQuery && filteredCommunities.length > 0"
            class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
          >
            <div class="p-2">
              <div class="text-xs font-semibold text-gray-500 uppercase px-2 py-1">Communities</div>
              <NuxtLink
                v-for="community in filteredCommunities"
                :key="community.id"
                :to="`/community/${community.id}`"
                class="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
                @click="closeSearch"
              >
                <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <img
                    v-if="community.icon"
                    :src="community.icon"
                    :alt="community.name"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-gray-600 text-xs font-bold">r</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{{ community.name }}</p>
                  <p v-if="community.description" class="text-xs text-gray-500 truncate">
                    {{ community.description }}
                  </p>
                </div>
              </NuxtLink>
            </div>
          </div>
          <div
            v-else-if="showSearchResults && searchQuery && filteredCommunities.length === 0"
            class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500 text-sm"
          >
            No communities found
          </div>
        </div>
      </div>

      <!-- Right: User Actions -->
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/profile"
          class="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
            :style="`background-color: ${displayUser.avatarColor || '#FF4500'}`"
          >
            <img
              v-if="displayUser.profileImage || displayUser.avatar"
              :src="displayUser.profileImage || displayUser.avatar"
              :alt="displayUser.firstName || displayUser.username"
              class="w-full h-full rounded-full object-cover"
            />
            <span v-else>
              {{ (displayUser.firstName?.[0] || displayUser.username?.[0] || 'U') + (displayUser.lastName?.[0] || '') }}
            </span>
          </div>
          <span class="hidden md:block text-sm font-medium text-gray-700">
            {{ displayUser.username || displayUser.firstName || 'User' }}
          </span>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Menu } from 'lucide-vue-next'
import { useMainStore } from '~/stores/main'
import { useCommunityStore } from '~/stores/communities'
import { getShopifyUser } from '~/utils/shopify'

const mainStore = useMainStore()
const communityStore = useCommunityStore()

const searchQuery = ref('')
const showSearchResults = ref(false)

const defaultUser = {
  firstName: 'User',
  lastName: '',
  username: 'user',
  avatarColor: '#FF4500',
}

const shopifyUser = computed(() => {
  if (import.meta.client) {
    return getShopifyUser()
  }
  return null
})

const displayUser = computed(() => {
  return mainStore.user || shopifyUser.value || defaultUser
})

// Filter communities based on search query
const filteredCommunities = computed(() => {
  if (!searchQuery.value.trim()) return []
  
  const query = searchQuery.value.toLowerCase().trim()
  const allCommunities = communityStore.getAllCommunities.value
  
  return allCommunities.filter(community => {
    const name = (community.name || '').toLowerCase()
    const description = (community.description || '').toLowerCase()
    const id = (community.id || '').toLowerCase()
    
    return name.includes(query) || description.includes(query) || id.includes(query)
  }).slice(0, 5) // Limit to 5 results
})

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    showSearchResults.value = true
  } else {
    showSearchResults.value = false
  }
}

const handleSearchEnter = () => {
  if (filteredCommunities.value.length > 0) {
    navigateTo(`/community/${filteredCommunities.value[0].id}`)
    closeSearch()
  }
}

const closeSearch = () => {
  showSearchResults.value = false
  searchQuery.value = ''
}

// Close search when clicking outside
if (import.meta.client) {
  watch(showSearchResults, (isOpen) => {
    if (isOpen) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('.relative')) {
          closeSearch()
          document.removeEventListener('click', handleClickOutside)
        }
      }
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 100)
    }
  })
}

const toggleSidebar = () => {
  mainStore.toggleSidebar()
}
</script>
