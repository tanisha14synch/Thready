<template>
  <div>
    <!-- Mobile Backdrop -->
    <div 
      v-if="mainStore.isSidebarOpen" 
      class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      @click="mainStore.closeSidebar"
    ></div>

    <aside
      :class="[
        'w-64 bg-white border-r border-gray-200',
        'fixed top-12 left-0 z-50 transition-transform duration-300 overflow-y-auto',
        'md:fixed md:top-12 md:translate-x-0 md:z-40',
        'h-[calc(100vh-3rem)]', // Full height minus header (h-12 = 3rem)
        mainStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- User Info Section -->
      <div class="p-4 border-b border-gray-200">
        <NuxtLink to="/profile" class="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-md -mx-2">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-black text-sm font-medium"
            :style="`background-color: ${displayUser.avatarColor || '#E9D386'}`"
          >
            <img
              v-if="displayUser.profileImage"
              :src="displayUser.profileImage"
              :alt="displayUser.firstName"
              class="w-full h-full rounded-full object-cover"
            />
            <span v-else>
              {{ (displayUser.firstName?.[0] || 'U') + (displayUser.lastName?.[0] || '') }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ displayUser.firstName }} {{ displayUser.lastName }}
            </p>
            <p class="text-xs text-gray-500 truncate">u/{{ displayUser.username || 'user' }}</p>
          </div>
        </NuxtLink>
      </div>

      <!-- Main Navigation -->
      <nav class="py-2">
        <button
          v-for="item in sidebarItems"
          :key="item.name"
          @click="handleClick(item)"
          :class="[
            'flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-gray-100 transition-colors',
            mainStore.selectedSection === item.name ? 'bg-gray-50 border-l-4' : ''
          ]"
          :style="mainStore.selectedSection === item.name ? 'border-left-color: #E9D386' : ''"
        >
          <component :is="item.icon" class="w-5 h-5 text-gray-600" />
          <span class="font-medium text-gray-900">{{ item.label }}</span>
        </button>
      </nav>

    <!-- RECENT Section -->
    <div class="mt-4 px-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-medium uppercase tracking-wider text-gray-500">Recent</h3>
        <button class="text-gray-500">
          <ChevronUp class="w-4 h-4" />
        </button>
      </div>
      <div class="mt-2">
        <button 
          v-for="community in recentCommunities" 
          :key="community.id"
          @click="goToCommunity(community.id)"
          class="flex items-center gap-3 w-full text-left py-2 hover:bg-gray-100"
        >
          <div class="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs overflow-hidden">
            <img v-if="community.icon" :src="community.icon" alt="" class="w-full h-full object-cover" />
            <span v-else>r</span>
          </div>
          <span class="text-sm text-gray-900">{{ community.name || community.id || 'Unnamed' }}</span>
        </button>
        <div v-if="recentCommunities.length === 0" class="text-xs text-gray-500 py-2">
          No recent communities
        </div>
      </div>
    </div>

    <!-- COMMUNITIES Section -->
    <div class="mt-4 px-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-medium uppercase tracking-wider text-gray-500">Communities</h3>
        <button class="text-gray-500">
          <ChevronUp class="w-4 h-4" />
        </button>
      </div>
      <div class="mt-2 space-y-1">
        <button 
          v-for="community in allCommunities" 
          :key="community.id"
          @click="goToCommunity(community.id)"
          class="flex items-center gap-3 w-full text-left py-2 hover:bg-gray-100"
        >
          <div class="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs overflow-hidden">
            <img v-if="community.icon" :src="community.icon" alt="" class="w-full h-full object-cover" />
            <span v-else>r</span>
          </div>
          <span class="text-sm text-gray-900">{{ community.name || community.id || 'Unnamed Community' }}</span>
          <Star v-if="community.favorite" class="w-4 h-4 ml-auto text-yellow-400" />
        </button>
        <div v-if="allCommunities.length === 0" class="text-xs text-gray-500 py-4 text-center">
          <div v-if="communityStore.loading">Loading communities...</div>
          <div v-else>No communities available</div>
        </div>
      </div>
    </div>
  </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMainStore } from '~/stores/main'
import { useCommunityStore } from '~/stores/communities'
import { 
  Home, 
  Flame, 
  Compass, 
  ChevronUp,
  Plus,
  Settings,
  Star
} from 'lucide-vue-next'

const mainStore = useMainStore()
const communityStore = useCommunityStore()

// Fetch communities from backend when component mounts
onMounted(async () => {
  // Always try to fetch to get latest from backend
  if (!communityStore.loading) {
    try {
      await communityStore.fetchCommunities()
    } catch (error) {
      console.error('Failed to fetch communities in Sidebar:', error)
    }
  }
  // Also ensure we have at least the local data
  if (communityStore.communities.length === 0) {
    console.warn('No communities available in store')
  }
})

const defaultUser = {
  firstName: 'User',
  lastName: '',
  username: 'user',
  avatarColor: '#E9D386',
}

const displayUser = computed(() => {
  return mainStore.user || defaultUser
})

// Custom icons
const ModQueueIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6" />
      <path d="M9 15h6" />
    </svg>
  `
}

const ModMailIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  `
}

const ModIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  `
}

const sidebarItems = [
  { name: 'home', label: 'Home', icon: Home },
  { name: 'popular', label: 'Popular', icon: Flame },
]

// Get communities from the store
// In Pinia composition stores, refs are automatically reactive
// Access communities directly - Pinia will handle reactivity
const allCommunities = computed(() => {
  // Access the communities ref from the store
  // In Pinia, refs are automatically unwrapped in computed properties
  const comms = communityStore.communities
  // comms should be the array value directly (Pinia unwraps)
  if (Array.isArray(comms)) {
    return comms
  }
  // Fallback: if it's still a ref, get .value
  return comms?.value || []
})

const recentCommunities = computed(() => {
  // For demo purposes, use the first community for recent
  const communities = allCommunities.value
  return communities && communities.length > 0 ? [communities[0]] : []
})

const handleClick = (item) => {
  mainStore.setSection(item.name)
  mainStore.closeSidebar()
  navigateTo('/')
}

const goToCommunity = (communityId) => {
  mainStore.setCommunity(communityId)
  mainStore.closeSidebar()
  navigateTo(`/community/${communityId}`)
}
</script>
