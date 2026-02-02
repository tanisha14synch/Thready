<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Main Content -->
      <div class="w-full md:w-2/3">
        <div class="rounded-md p-4 mb-4 shadow-sm" style="background-color: var(--card-color);">
          <h1 class="text-2xl font-bold mb-4" style="color: var(--text-primary);">Create post</h1>
          
          <!-- Selected Community Header (Fixed) -->
          <div v-if="selectedCommunity" class="flex items-center gap-2 p-2 rounded-full mb-2" style="background-color: rgba(233, 211, 134, 0.3); color: var(--text-primary);">
            <div class="w-8 h-8 rounded-full overflow-hidden">
              <img 
                :src="selectedCommunity.icon || '/images/communities/default-header.jpg'" 
                :alt="selectedCommunity.name" 
                class="w-full h-full object-cover"
              />
            </div>
            <span class="font-medium">r/{{ selectedCommunity.name }}</span>
          </div>
          <div v-else class="p-4 rounded-md mb-4" style="background-color: rgba(233, 211, 134, 0.4); color: #000; border: 1px solid var(--border-color);">
             Please select a community from the home page or a community page to create a post.
          </div>
          <div v-if="selectedCommunity && !isJoined" class="p-3 rounded-md mb-4" style="background-color: rgba(233, 211, 134, 0.3); border: 1px solid var(--border-color); color: var(--text-primary);">
            Join this community to create a post.
          </div>
          
          <!-- Post Content -->
          <div class="mb-4">
            <input 
              type="text" 
              placeholder="Title" 
              class="w-full p-3 mb-4 border rounded-md"
              v-model="postTitle"
            />
            
            <div class="border rounded-md">
              <textarea 
                placeholder="Text (optional)" 
                class="w-full p-3 min-h-[200px] rounded-md focus:outline-none"
                v-model="postContent"
              ></textarea>
            </div>

            <!-- Image Upload (optional) -->
            <div class="rounded-md pt-4">
              <div 
                class="border-2 border-dashed p-6 rounded-md transition-colors cursor-pointer text-center"
                style="border-color: var(--border-color);"
                @mouseenter="(e) => e.currentTarget.style.backgroundColor = 'rgba(233, 211, 134, 0.15)'"
                @mouseleave="(e) => e.currentTarget.style.backgroundColor = ''"
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
                <p class="text-sm" style="color: var(--text-secondary);">Click or drag & drop</p>
              </div>

              <div v-if="postImage" class="mt-3 relative border rounded-md p-2">
                <img :src="postImage" class="max-h-[260px] mx-auto object-contain rounded" />
                <button 
                  @click="removeImage"
                  class="absolute top-2 right-2 rounded-full p-1 hover:opacity-100"
            style="background-color: rgba(0,0,0,0.7); color: #fff;"
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
            <button class="px-4 py-2 border  rounded-full">Save Draft</button>
            <button 
              class="px-4 py-2 rounded-full flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style="background-color: var(--primary-color); color: #000;"
              :disabled="!canSubmitPost || isSubmitting"
              @click="submitPost"
            >
              <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-if="isSubmitting">Posting...</span>
              <span v-else>Post</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Sidebar -->
      <div class="w-full md:w-1/3">
        <!-- Community Card -->
        <div v-if="selectedCommunity" class="rounded-md overflow-hidden shadow-sm mb-4" style="background-color: var(--card-color); border: 1px solid var(--border-color);">
          <div class="h-20 bg-cover bg-center" :style="`background-image: url(${selectedCommunity.headerImage || '/images/communities/default-header.jpg'})`"></div>
          <div class="p-4">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 rounded-full overflow-hidden border-4 -mt-8" style="border-color: var(--secondary-color);">
                <img 
                  :src="selectedCommunity.icon || '/images/communities/default-header.jpg'" 
                  :alt="selectedCommunity.name" 
                  class="w-full h-full object-cover"
                />
              </div>
              <h2 class="text-lg font-bold" style="color: var(--text-primary);">r/{{ selectedCommunity.name }}</h2>
            </div>
            <p class="text-sm mb-3" style="color: var(--text-secondary);">{{ selectedCommunity.description }}</p>
            <div class="flex items-center text-sm mb-2" style="color: var(--text-secondary);">
              <span class="mr-4">
                <strong style="color: var(--text-primary);">{{ formatNumber(selectedCommunity.members) }}</strong> members
              </span>
              <span>
                <strong style="color: var(--text-primary);">{{ selectedCommunity.online }}</strong> online
              </span>
            </div>
            <div class="text-xs" style="color: var(--text-secondary);">
              Created {{ formatDate(selectedCommunity.createdDate) }}
            </div>
          </div>
          
          <!-- Community Rules -->
          <div class="border-t p-4" style="border-color: var(--divider-color);">
            <h3 class="font-bold mb-2" style="color: var(--text-primary);">r/{{ selectedCommunity.name }} Rules</h3>
            <ol class="list-decimal list-inside text-sm" style="color: var(--text-primary);">
              <li class="py-2 border-b last:border-0" style="border-color: var(--divider-color);">Be respectful to others</li>
              <li class="py-2 border-b last:border-0" style="border-color: var(--divider-color);">No spam or self-promotion</li>
              <li class="py-2 border-b last:border-0" style="border-color: var(--divider-color);">Use appropriate tags for content</li>
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
