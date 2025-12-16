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
        'w-64 bg-white min-h-screen border-r border-gray-200',
        'fixed top-12 left-0 z-50 transition-transform duration-300 overflow-y-auto',
        'md:relative md:top-0 md:translate-x-0 md:z-auto',
        mainStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- User Info Section -->
      <div class="p-4 border-b border-gray-200">
        <NuxtLink to="/profile" class="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-md -mx-2">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
            :style="`background-color: ${displayUser.avatarColor || '#FF4500'}`"
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
            mainStore.selectedSection === item.name ? 'bg-gray-50 border-l-4 border-orange-500' : ''
          ]"
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
          {{ community.name }}
        </button>
      </div>
    </div>

    <!-- COMMUNITIES Section -->
    <div class="mt-4 px-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-medium uppercase tracking-wider text-gray-500">Communities</h3>
        <button class="text-gray-500">
          <ChevronUp class="w-4 h-4" />
        </button>
      </div>
      <!-- Search in Sidebar -->
      <div class="mb-2">
        <input
          v-model="sidebarSearchQuery"
          type="text"
          placeholder="Search communities..."
          class="w-full px-3 py-1.5 text-xs bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
        />
      </div>
      <div class="mt-2 space-y-1 max-h-64 overflow-y-auto">
        <button 
          v-for="community in filteredSidebarCommunities" 
          :key="community.id"
          @click="goToCommunity(community.id)"
          class="flex items-center gap-3 w-full text-left py-2 hover:bg-gray-100 rounded-md"
        >
          <div class="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs overflow-hidden flex-shrink-0">
            <img v-if="community.icon" :src="community.icon" alt="" class="w-full h-full object-cover" />
            <span v-else>r</span>
          </div>
          <span class="text-sm truncate">{{ community.name }}</span>
          <Star v-if="community.favorite" class="w-4 h-4 ml-auto text-yellow-400 flex-shrink-0" />
        </button>
        <div v-if="filteredSidebarCommunities.length === 0 && sidebarSearchQuery" class="text-xs text-gray-500 text-center py-4">
          No communities found
        </div>
      </div>
    </div>
  </aside>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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

const defaultUser = {
  firstName: 'User',
  lastName: '',
  username: 'user',
  avatarColor: '#FF4500',
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
const sidebarSearchQuery = ref('')

const allCommunities = computed(() => communityStore.getAllCommunities.value)
const recentCommunities = computed(() => {
  // For demo purposes, use the first community for recent
  const communities = communityStore.getAllCommunities.value
  return communities.length > 0 ? [communities[0]] : []
})

// Filter communities in sidebar based on search
const filteredSidebarCommunities = computed(() => {
  const communities = allCommunities.value
  if (!sidebarSearchQuery.value.trim()) {
    return communities
  }
  
  const query = sidebarSearchQuery.value.toLowerCase().trim()
  return communities.filter(community => {
    const name = (community.name || '').toLowerCase()
    const description = (community.description || '').toLowerCase()
    const id = (community.id || '').toLowerCase()
    
    return name.includes(query) || description.includes(query) || id.includes(query)
  })
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
