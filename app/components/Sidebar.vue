<template>
  <aside
    class="w-64 bg-white min-h-screen hidden md:block px-2 py-4 border-r border-gray-200"
  >
    <!-- Main Navigation -->
    <nav class="py-2 ">
      <button
        v-for="item in sidebarItems"
        :key="item.name"
        @click="handleClick(item)"
        class="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-gray-100"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span>{{ item.label }}</span>
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
          {{ community.name }}
          <Star v-if="community.favorite" class="w-4 h-4 ml-auto text-yellow-400" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
const allCommunities = ref([])
const recentCommunities = ref([])

onMounted(() => {
  allCommunities.value = communityStore.getAllCommunities
  // For demo purposes, use the same communities for recent
  recentCommunities.value = [communityStore.getAllCommunities[0]]
})

const handleClick = (item) => {
  mainStore.setSection(item.name)
  navigateTo('/')
}

const goToCommunity = (communityId) => {
  mainStore.setCommunity(communityId)
  navigateTo(`/community/${communityId}`)
}
</script>
