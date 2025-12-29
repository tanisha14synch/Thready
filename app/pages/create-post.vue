<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Main Content -->
      <div class="w-full md:w-2/3">
        <div class="bg-white  rounded-md p-4 mb-4 shadow-sm">
          <h1 class="text-2xl font-bold mb-4">Create post</h1>
          
          <!-- Selected Community Header (Fixed) -->
          <div v-if="selectedCommunity" class="flex items-center gap-2 p-2 bg-gray-100 rounded-full mb-2">
            <div class="w-8 h-8 rounded-full overflow-hidden">
              <img 
                :src="selectedCommunity.icon || '/images/communities/default-header.jpg'" 
                :alt="selectedCommunity.name" 
                class="w-full h-full object-cover"
              />
            </div>
            <span class="font-medium">r/{{ selectedCommunity.name }}</span>
          </div>
          <div v-else class="p-4 bg-red-100 text-red-700 rounded-md mb-4">
             Please select a community from the home page or a community page to create a post.
          </div>
          <div v-if="selectedCommunity && !isJoined" class="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md mb-4">
            Join this community to create a post.
          </div>
          
          <!-- Post Content -->
          <div class="mb-4">
            <input 
              type="text" 
              placeholder="Title" 
              class="w-full p-3 mb-4 border border-[#E9D386] rounded-md focus:outline-none focus:border-[#D4C070] focus:ring-1 focus:ring-[#D4C070] focus:shadow-[0_0_0_2px_rgba(233,211,134,0.2)] transition-all"
              v-model="postTitle"
            />
            
            <div class="border border-[#E9D386] rounded-md focus-within:border-[#D4C070] focus-within:ring-1 focus-within:ring-[#D4C070] focus-within:shadow-[0_0_0_2px_rgba(233,211,134,0.2)] transition-all">
              <textarea 
                placeholder="Text (optional)" 
                class="w-full p-3 min-h-[200px] rounded-md focus:outline-none"
                v-model="postContent"
              ></textarea>
            </div>

            <!-- Image Upload (optional) -->
            <div class="rounded-md pt-4">
              <div 
                class="border border-dashed border-[#E9D386] p-6 rounded-md hover:border-[#D4C070] hover:bg-[#E9D386]/10 hover:shadow-[0_0_0_2px_rgba(233,211,134,0.2)] transition-all cursor-pointer text-center"
                @click="triggerFileInput"
                @dragover.prevent
                @drop.prevent="handleDrop"
              >
                <input 
                  type="file" 
                  ref="fileInput" 
                  class="hidden" 
                  accept="image/*"
                  @change="handleFileChange"
                />
                <p class="mb-2 font-medium">Add an image (optional)</p>
                <p class="text-sm text-gray-500">Click or drag & drop</p>
              </div>

              <div v-if="postImage" class="mt-3 relative border rounded-md p-2">
                <img :src="postImage" class="max-h-[260px] mx-auto object-contain rounded" />
                <button 
                  @click="removeImage"
                  class="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-100"
                  aria-label="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Post Actions -->
          <div class="flex justify-end gap-2">
            <button class="px-4 py-2 border-2 border-[#E9D386] text-[#E9D386] rounded-full hover:bg-[#E9D386] hover:text-black transition-colors">Save Draft</button>
            <button 
              class="px-4 py-2 bg-[#E9D386] text-black rounded-full flex items-center gap-2 hover:bg-[#D4C070] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="!canSubmitPost || isSubmitting"
              @click="submitPost"
            >
              <span v-if="isSubmitting" class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              <span v-if="isSubmitting">Posting...</span>
              <span v-else>Post</span>
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
import { usePostStore } from '~/stores/posts'

const route = useRoute()
const router = useRouter()
const communityStore = useCommunityStore()
const mainStore = useMainStore()
const postStore = usePostStore()

// Post form data
const postTitle = ref('')
const postContent = ref('')
const postImage = ref(null)

// UI state
const selectedCommunity = ref(null)
const isSubmitting = ref(false)
const fileInput = ref(null)

const isJoined = computed(() => {
  if (!selectedCommunity.value) return false
  return mainStore.isJoined(selectedCommunity.value.id)
})

const canSubmitPost = computed(() => {
  return selectedCommunity.value && postTitle.value.trim().length > 0 && isJoined.value
})

// File Upload Handlers
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

const handleDrop = (event) => {
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

const processFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    postImage.value = e.target?.result
  }
  reader.readAsDataURL(file)
}

const removeImage = () => {
  postImage.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Submit post
const submitPost = async () => {
  if (!canSubmitPost.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    await postStore.createPost({
      communityId: selectedCommunity.value.id,
      title: postTitle.value,
      content: postContent.value,
      image: postImage.value,
      user: 'CurrentUser', // Placeholder
      avatar: '/images/avatars/default-avatar.jpg',
      shareable: true
    })
    
    // Navigate back to the community page
    await router.push(`/community/${selectedCommunity.value.id}`)
  } catch (error) {
    console.error('Failed to create post:', error)
    // Ideally show a notification here
  } finally {
    isSubmitting.value = false
  }
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
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

// Check if we have a community ID from the route
onMounted(async () => {
  const communityId = route.query.c || route.query.community
  if (communityId) {
    // Ensure communities are loaded
    if (communityStore.communities.length === 0) {
        await communityStore.fetchCommunities()
    }
    const community = communityStore.getCommunityById(communityId)
    if (community && community.value) {
      selectedCommunity.value = community.value
      // auto-join to allow posting when coming from community page
      if (!mainStore.isJoined(communityId)) {
        mainStore.joinCommunity(communityId)
      }
    }
  }
})
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
