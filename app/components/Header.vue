<template>
  <header class="w-full fixed top-0 left-0 right-0 z-50" style="background-color: var(--secondary-color); border-bottom: 1px solid var(--border-color);">
    <div class="max-w-full mx-auto px-4 flex items-center justify-between h-12">
      <!-- Left: Logo & Search -->
      <div class="flex items-center gap-4 flex-1">
        <button class="md:hidden" @click="toggleSidebar">
          <Menu class="w-6 h-6" style="color: var(--text-primary);" />
        </button>
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background-color: var(--primary-color);">
            <span class="font-bold text-xs" style="color: #000;">TBW</span>
          </div>
          <h1 class="font-bold text-xl hidden sm:block" style="color: var(--text-primary);">thebarwardrobe</h1>
        </NuxtLink>
        <div ref="searchContainer" class="hidden md:flex flex-1 max-w-xl relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search thebarwardrobe"
            class="w-full px-4 py-2 rounded-full text-sm focus:outline-none"
            style="background-color: #f5f5f5; border: 1px solid var(--border-color);"
            @focus="(e) => { e.target.style.borderColor = 'var(--primary-color)'; handleSearchFocus() }"
            @blur="(e) => { e.target.style.borderColor = 'var(--border-color)' }"
            @input="handleSearch"
            @keyup.enter="handleSearchEnter"
          />
          <!-- Search Results Dropdown -->
          <div
            v-if="showSearchResults && searchQuery && filteredCommunities.length > 0"
            class="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
            style="background-color: var(--secondary-color); border: 1px solid var(--border-color);"
          >
            <div class="p-2">
              <div class="text-xs font-semibold uppercase px-2 py-1" style="color: var(--text-secondary);">Communities</div>
              <NuxtLink
                v-for="community in filteredCommunities"
                :key="community.id"
                :to="`/community/${community.id}`"
                class="flex items-center gap-3 px-3 py-2 rounded-md"
            style="color: var(--text-primary);"
            @mouseenter="(e) => e.currentTarget.style.backgroundColor = 'rgba(233, 211, 134, 0.2)'"
            @mouseleave="(e) => e.currentTarget.style.backgroundColor = ''"
                @click="closeSearch"
              >
                <div class="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style="background-color: rgba(233, 211, 134, 0.4);">
                  <img
                    v-if="community.icon"
                    :src="community.icon"
                    :alt="community.name"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-xs font-bold" style="color: var(--text-primary);">r</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium" style="color: var(--text-primary);">{{ community.name }}</p>
                  <p v-if="community.description" class="text-xs truncate" style="color: var(--text-secondary);">
                    {{ community.description }}
                  </p>
                </div>
              </NuxtLink>
            </div>
          </div>
          <div
            v-else-if="showSearchResults && searchQuery && filteredCommunities.length === 0"
            class="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg z-50 p-4 text-center text-sm"
            style="background-color: var(--secondary-color); border: 1px solid var(--border-color); color: var(--text-secondary);"
          >
            No communities found
          </div>
        </div>
      </div>

      <!-- Right: User Actions -->
      <div class="flex items-center gap-2">
        <a
          v-if="!mainStore.authToken"
          :href="shopifyAuthUrl"
          target="_self"
          rel="noopener noreferrer"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
          style="background-color: var(--primary-color); color: #000;"
        >
          Log in with Shopify
        </a>
        <NuxtLink
          v-else
          to="/profile"
          class="flex items-center gap-2 px-2 py-1 rounded-full transition-colors"
            style="--hover-bg: rgba(233, 211, 134, 0.2);"
            @mouseenter="(e) => e.currentTarget.style.backgroundColor = 'rgba(233, 211, 134, 0.2)'"
            @mouseleave="(e) => e.currentTarget.style.backgroundColor = ''"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
            :style="`background-color: ${displayUser.avatarColor || '#E9D386'}`"
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
          <span class="hidden md:block text-sm font-medium" style="color: var(--text-primary);">
            {{ displayUser.username || displayUser.firstName || 'User' }}
          </span>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Menu } from 'lucide-vue-next'
import { useMainStore } from '~/stores/main'
import { useCommunityStore } from '~/stores/communities'
import { getShopifyUser } from '~/utils/shopify'

const mainStore = useMainStore()
const communityStore = useCommunityStore()

const config = useRuntimeConfig()
const shop = config.public.shopifyShop || 'thebarwardrobe.myshopify.com'
// Use same-origin /auth/shopify so we never hardcode a Shopify URL in the frontend.
// Nitro GET /auth/shopify builds the Shopify login URL and redirects the browser; redirect_uri is our callback.
const shopifyAuthUrl = `/auth/shopify?shop=${encodeURIComponent(shop)}`

// Ensure communities are loaded when header mounts
onMounted(async () => {
  if (communityStore.communities.length === 0 && !communityStore.loading) {
    try {
      await communityStore.fetchCommunities()
    } catch (error) {
      console.warn('Failed to fetch communities in Header:', error)
    }
  }
})

const searchQuery = ref('')
const showSearchResults = ref(false)
const searchContainer = ref(null)

const defaultUser = {
  firstName: 'User',
  lastName: '',
  username: 'user',
  avatarColor: '#E9D386',
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
  if (!searchQuery.value || !searchQuery.value.trim()) return []
  
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return []
  
  // Access communities directly from the store (Pinia unwraps refs automatically)
  const allCommunities = communityStore.communities
  
  // Ensure it's an array - handle both ref and direct array access
  let communitiesArray = []
  if (Array.isArray(allCommunities)) {
    communitiesArray = allCommunities
  } else if (allCommunities && typeof allCommunities === 'object' && 'value' in allCommunities) {
    communitiesArray = Array.isArray(allCommunities.value) ? allCommunities.value : []
  }
  
  if (!Array.isArray(communitiesArray) || communitiesArray.length === 0) {
    return []
  }
  
  const filtered = communitiesArray.filter(community => {
    if (!community) return false
    const name = (community.name || '').toLowerCase()
    const description = (community.description || '').toLowerCase()
    const id = (community.id || '').toLowerCase()
    
    return name.includes(query) || description.includes(query) || id.includes(query)
  })
  
  return filtered.slice(0, 5) // Limit to 5 results
})

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    showSearchResults.value = true
  } else {
    showSearchResults.value = false
  }
}

const handleSearchFocus = () => {
  // Ensure communities are loaded when user focuses on search
  if (communityStore.communities.length === 0 && !communityStore.loading) {
    communityStore.fetchCommunities()
  }
  if (searchQuery.value.trim()) {
    showSearchResults.value = true
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

// Watch for communities to load and update search results
watch(() => communityStore.communities, () => {
  // When communities load, update search if there's a query
  if (searchQuery.value.trim() && showSearchResults.value) {
    // Force reactivity update
    searchQuery.value = searchQuery.value
  }
}, { deep: true })

// Close search when clicking outside
if (import.meta.client) {
  watch(showSearchResults, (isOpen) => {
    if (isOpen) {
      const handleClickOutside = (e) => {
        if (searchContainer.value && !searchContainer.value.contains(e.target)) {
          closeSearch()
          document.removeEventListener('click', handleClickOutside)
        }
      }
      // Use nextTick to ensure DOM is updated
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
