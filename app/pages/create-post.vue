<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Main Content -->
      <div class="w-full md:w-2/3">
        <div class="bg-white  rounded-md p-4 mb-4 shadow-sm">
          <h1 class="text-2xl font-bold mb-4">Create post</h1>
          
          <!-- Community Selector -->
          <div class="flex items-center">
            <div v-if="selectedCommunity" class="flex items-center gap-2 p-2 bg-gray-100  rounded-full">
              <div class="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  :src="selectedCommunity.icon || '/images/communities/default-header.jpg'" 
                  :alt="selectedCommunity.name" 
                  class="w-full h-full object-cover"
                />
              </div>
              <span class="font-medium">r/{{ selectedCommunity.name }}</span>
              <button class="ml-2" @click="showCommunitySelector = true">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <button v-else class="flex items-center gap-2 p-2 bg-gray-100  rounded-md" @click="showCommunitySelector = true">
              <span>Select a community</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
            
            <!-- Community Selector Dropdown -->
            <div v-if="showCommunitySelector" class="absolute mt-2 bg-white rounded-md shadow-lg z-10 p-2 max-h-60 overflow-y-auto" style="top: 120px; width: 300px;">
              <div class="p-2">
                <input 
                  type="text" 
                  placeholder="Search communities" 
                  class="w-full p-2 rounded-md border border-gray-300"
                  v-model="communitySearch"
                />
              </div>
              <div class="py-2">
                <div 
                  v-for="community in filteredCommunities" 
                  :key="community.id" 
                  class="flex items-center gap-2 p-2 hover:bg-gray-100  rounded-md cursor-pointer"
                  @click="selectCommunity(community)"
                >
                  <div class="w-8 h-8 rounded-full overflow-hidden">
                    <img 
                      :src="community.icon || '/images/communities/default-header.jpg'" 
                      :alt="community.name" 
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <span>r/{{ community.name }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Post Type Tabs -->
          <div class="flex border-b  mb-4">
            <button 
              v-for="tab in postTabs" 
              :key="tab.id" 
              class="px-4 py-2 font-medium" 
              :class="activeTab === tab.id ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'"
              @click="activeTab = tab.id"
            >
              {{ tab.name }}
            </button>
          </div>
          
          <!-- Post Content -->
          <div class="mb-4">
            <input 
              type="text" 
              placeholder="Title" 
              class="w-full p-3 mb-4 border  rounded-md"
              v-model="postTitle"
            />
            
            <div class="border  rounded-md">
              <div class="flex border-b p-2">
                <button class="p-1 mx-1">B</button>
                <button class="p-1 mx-1"><i>I</i></button>
                <button class="p-1 mx-1">Link</button>
                <button class="p-1 mx-1">•</button>
              </div>
              <textarea 
                placeholder="Text (optional)" 
                class="w-full p-3 min-h-[200px] rounded-b-md"
                v-model="postContent"
              ></textarea>
            </div>
            
            <div class=" rounded-md pt-4 text-center">
              <div class="border-2 border-dashed p-8 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="mb-2">Drag and drop images or</p>
                <button class="bg-yellow-500 text-white px-4 py-2 rounded-full">Upload</button>
              </div>
            </div>    
          </div>
          
          <!-- Post Actions -->
          <div class="flex justify-end gap-2">
            <button class="px-4 py-2 border  rounded-full">Save Draft</button>
            <button 
              class="px-4 py-2 bg-yellow-400 text-white rounded-full"
              :disabled="!canSubmitPost"
              @click="submitPost"
            >
              Post
            </button>
          </div>
        </div>
      </div>
      
      <!-- Sidebar -->
      <div class="w-full md:w-1/3">
        <!-- Community Card -->
        <div v-if="selectedCommunity" class="bg-white rounded-md overflow-hidden shadow-sm mb-4">
          <div class="h-20 bg-cover bg-center" :style="`background-image: url(${selectedCommunity.headerImage || '/images/communities/default-header.jpg'})`"></div>
          <div class="p-4">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 rounded-full overflow-hidden border-4 border-white -mt-8">
                <img 
                  :src="selectedCommunity.icon || '/images/communities/default-header.jpg'" 
                  :alt="selectedCommunity.name" 
                  class="w-full h-full object-cover"
                />
              </div>
              <h2 class="text-lg font-bold">r/{{ selectedCommunity.name }}</h2>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{{ selectedCommunity.description }}</p>
            <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span class="mr-4">
                <strong>{{ formatNumber(selectedCommunity.members) }}</strong> members
              </span>
              <span>
                <strong>{{ selectedCommunity.online }}</strong> online
              </span>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Created {{ formatDate(selectedCommunity.createdDate) }}
            </div>
          </div>
          
          <!-- Community Rules -->
          <div class="border-t dark:border-gray-700 p-4">
            <h3 class="font-bold mb-2">r/{{ selectedCommunity.name }} Rules</h3>
            <ol class="list-decimal list-inside text-sm">
              <li class="py-2 border-b dark:border-gray-700 last:border-0">Be respectful to others</li>
              <li class="py-2 border-b dark:border-gray-700 last:border-0">No spam or self-promotion</li>
              <li class="py-2 border-b dark:border-gray-700 last:border-0">Use appropriate tags for content</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommunityStore } from '~/stores/communities'
import { useMainStore } from '~/stores/main'

const route = useRoute()
const router = useRouter()
const communityStore = useCommunityStore()
const mainStore = useMainStore()

// Post form data
const postTitle = ref('')
const postContent = ref('')
const postLink = ref('')
const pollOptions = ref(['', ''])

// UI state
const activeTab = ref('text')
const showCommunitySelector = ref(false)
const communitySearch = ref('')
const selectedCommunity = ref(null)


// Get all communities
const communities = computed(() => {
  return communityStore.getAllCommunities()
})

// Filter communities based on search
const filteredCommunities = computed(() => {
  if (!communitySearch.value) return communities.value
  
  return communities.value.filter(community => 
    community.name.toLowerCase().includes(communitySearch.value.toLowerCase())
  )
})

// Check if post can be submitted
const canSubmitPost = computed(() => {
  return selectedCommunity.value && postTitle.value.trim().length > 0
})

// Select a community
const selectCommunity = (community) => {
  selectedCommunity.value = community
  showCommunitySelector.value = false
}

// Submit post
const submitPost = () => {
  // Here you would typically call an API to create the post
  // For now, we'll just navigate back to the community page
  router.push(`/community/${selectedCommunity.value.id}`)
}

// Format numbers (e.g., 1000 -> 1k)
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'm'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num
}

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

// Check if we have a community ID from the route
onMounted(() => {
  const communityId = route.query.community
  if (communityId) {
    const community = communityStore.getCommunityById(communityId)
    if (community && community.value) {
      selectedCommunity.value = community.value
    }
  }
})
</script>

<style scoped>
/* Add any component-specific styles here */
</style>