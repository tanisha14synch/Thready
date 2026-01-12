<template>
  <section :class="[cardWidth, 'my-6 p-4 border rounded-xl border-gray-200 bg-gray-300']">
    <!-- 🧍 User Info & Actions -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <NuxtImg :src="post.avatar || '/images/avatars/default-avatar.jpg'" class="w-8 h-8 rounded-full" />
        <div class="flex flex-col">
          <p class="font-semibold text-xs">{{ post.user }}</p>
          <p class="text-xs text-gray-500">Posted {{ post.postedAt }}</p>
        </div>
      </div>
      
      <!-- Post Actions -->
      <div class="flex gap-2">
        <button 
          @click="initiateDeletePost" 
          class="text-gray-500 hover:text-red-600 transition-colors"
          title="Delete Post"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>

    <!-- 📝 Post Title & Content -->
    <div>
      <p class="text-base font-medium">{{ post.title }}</p>
      <p v-if="post.content" class="text-sm mt-1 text-gray-800">{{ post.content }}</p>
    </div>

    <!-- 🖼️ Post Media -->
    <div class="mt-2">
      <NuxtImg
        v-if="post.image"
        :src="post.image"
        class="w-full h-[40vh] object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
        @click="openImage(post.image)"
      />
      <video
        v-else-if="post.video"
        :src="post.video"
        controls
        class="w-full h-auto rounded-xl mt-2"
      ></video>
    </div>

    <!-- ⚙️ Post Actions -->
    <div class="flex flex-wrap items-center justify-between mt-4">
      <div class="flex items-center gap-1">
        <!-- Upvote / Downvote -->
        <div class="flex items-center mt-2 gap-0 justify-center border border-gray-400 rounded-full px-1">
          <button
            :class="['p-2 rounded-full text-xs', userVote === 1 ? 'text-blue-600' : 'text-gray-700']"
            @click="handleUpvote"
          >
            <i class="fas fa-arrow-up"></i>
          </button>
          <div class="text-sm font-medium text-gray-700">{{ displayedScore }}</div>
          <button
            :class="['p-2 rounded-full text-xs', userVote === -1 ? 'text-red-600' : 'text-gray-700']"
            @click="handleDownvote"
          >
            <i class="fas fa-arrow-down"></i>
          </button>
        </div>

        <!-- Comment Button -->
        <button
          class="ml-2 p-2 border rounded-full text-xs border-gray-400 mt-2"
          @click="toggleComment"
        >
          <i class="fas fa-comment"></i> Comment
        </button>

        <!-- Share Button -->
        <button
          v-if="post.shareable"
          class="ml-2 p-2 border rounded-full text-xs border-gray-400 mt-2"
          @click="handleShare"
        >
          <i class="fas fa-share"></i>
        </button>

        <!-- Share Status -->
        <span class="text-xs text-gray-500 ml-2">{{ shareMessage }}</span>
      </div>
    </div>

    <!-- 🗨️ Comments Section -->
    <div v-if="showComment" class="mt-4 bg-gray-50 p-4 rounded-lg">
      <textarea
        ref="textarea"
        v-model="newCommentText"
        class="w-full p-2 border border-[#E9D386] rounded mb-2 text-sm focus:outline-none focus:border-[#D4C070] focus:ring-1 focus:ring-[#D4C070] focus:shadow-[0_0_0_2px_rgba(233,211,134,0.2)] transition-all"
        placeholder="Write a comment..."
        rows="2"
      ></textarea>
      <div class="flex justify-end">
        <button 
          @click="handleAddComment" 
          class="bg-[#E9D386] text-black px-4 py-1 rounded text-sm hover:bg-[#D4C070] disabled:opacity-50 transition-colors"
          :disabled="!newCommentText.trim() || postStore.loading"
        >
          {{ postStore.loading ? 'Posting...' : 'Post' }}
        </button>
      </div>

      <!-- 🔁 Loop through comments -->
      <div v-if="comments.length" class="mt-4 space-y-4">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="pb-3 border-b border-gray-100 last:border-0"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3 w-full">
              <NuxtImg :src="comment.avatar || '/images/avatars/default-avatar.jpg'" class="w-8 h-8 rounded-full" />
              <div class="w-full">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-xs">{{ comment.user }}</p>
                        <p class="text-xs text-gray-500">Commented {{ formatDate(comment.commentedAt) }}</p>
                    </div>
                    
                     <!-- Comment Actions (Vote & Delete) -->
                    <div class="flex items-center gap-3">
                        <!-- Vote -->
                        <div class="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                            <button 
                                @click="voteComment(comment.id, 1)" 
                                :class="['text-xs hover:bg-gray-100 p-1 rounded', comment.userVote === 1 ? 'text-blue-600' : 'text-gray-500']"
                            >
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <span class="text-xs font-medium min-w-[12px] text-center">{{ comment.displayedScore || 0 }}</span>
                            <button 
                                @click="voteComment(comment.id, -1)" 
                                :class="['text-xs hover:bg-gray-100 p-1 rounded', comment.userVote === -1 ? 'text-red-600' : 'text-gray-500']"
                            >
                                <i class="fas fa-arrow-down"></i>
                            </button>
                        </div>
                        
                        <!-- Delete - Only show if user owns the comment -->
                        <button 
                            v-if="canDeleteComment(comment)"
                            @click="initiateDeleteComment(comment.id)" 
                            class="text-gray-400 hover:text-red-600 text-xs transition-colors"
                            title="Delete Comment"
                        >
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="text-sm mt-1 text-gray-700">{{ comment.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="mt-4 text-center text-gray-500 text-sm">
        No comments yet. Be the first to comment!
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal
        :isOpen="showDeleteModal"
        :title="deleteModalTitle"
        :message="deleteModalMessage"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
    />

    <!-- Image Viewer Modal -->
    <ImageViewer
        :isOpen="showImageViewer"
        :imageSrc="selectedImage"
        :alt="post.title"
        @close="closeImageViewer"
    />

  </section>
</template>

<script setup>
import { ref, computed, toRef, nextTick } from 'vue'
import { usePostStore } from '~/stores/posts'
import { getShopifyUser } from '~/utils/shopify'
import ConfirmationModal from '~/components/ConfirmationModal.vue'
import ImageViewer from '~/components/ImageViewer.vue'

/* 🧩 Props */
const props = defineProps({
  post: { type: Object, required: true },
  cardWidth: { type: String, default: 'w-full h-auto' },
})

const postStore = usePostStore()
const currentUser = getShopifyUser()

/* 🧠 Reactive State */
const post = toRef(props, 'post')
const cardWidth = toRef(props, 'cardWidth')
const showComment = ref(false)
const textarea = ref(null)
const shareMessage = ref('')
const newCommentText = ref('')

// Delete Modal State
const showDeleteModal = ref(false)
const itemToDelete = ref(null) // ID
const deleteType = ref(null) // 'post' or 'comment'
const deleteError = ref(null) // Error message if deletion fails

// Image Viewer State
const showImageViewer = ref(false)
const selectedImage = ref('')

const deleteModalTitle = computed(() => deleteType.value === 'post' ? 'Delete Post' : 'Delete Comment')
const deleteModalMessage = computed(() => {
  if (deleteError.value) {
    return deleteError.value
  }
  return `Do you want to delete this ${deleteType.value}?`
})

/* 💬 Computed: comments */
const comments = computed(() => post.value?.commentsList ?? [])

/* 🔐 Auth Checks */
const canDeletePost = computed(() => {
    if (!currentUser) return false
    // Check ID match (preferred) or username match (legacy)
    return post.value.userId === currentUser.id || post.value.user === currentUser.username
})

function canDeleteComment(comment) {
    if (!currentUser) return false
    // STRICT CHECK: Only allow deletion if userId matches exactly
    // Check both userId (preferred) and username (legacy fallback)
    const userIdMatch = comment.userId && currentUser.id && String(comment.userId) === String(currentUser.id)
    const usernameMatch = comment.user && currentUser.username && comment.user === currentUser.username
    return userIdMatch || usernameMatch
}

/* 🗑️ Delete Logic */
function initiateDeletePost() {
    itemToDelete.value = post.value.id
    deleteType.value = 'post'
    showDeleteModal.value = true
}

function initiateDeleteComment(commentId) {
    itemToDelete.value = commentId
    deleteType.value = 'comment'
    showDeleteModal.value = true
}

function cancelDelete() {
    showDeleteModal.value = false
    itemToDelete.value = null
    deleteType.value = null
    deleteError.value = null
}

async function confirmDelete() {
    deleteError.value = null // Clear previous error
    try {
        if (deleteType.value === 'post') {
            await postStore.deletePost(itemToDelete.value)
        } else if (deleteType.value === 'comment') {
            await postStore.deleteComment(post.value.id, itemToDelete.value)
        }
        cancelDelete()
    } catch (error) {
        // Show error message in modal
        deleteError.value = error.message || 'Failed to delete. You can only delete your own posts/comments.'
        console.error('Delete failed:', error)
        // Keep modal open so user can see the error
    }
}


/* 🗳️ Voting System */
const userVote = computed(() => post.value.userVote || 0)

const displayedScore = computed(() => {
    // Score = (upvotes - downvotes)
    return (post.value.upvotes || 0) - (post.value.downvotes || 0)
})

function handleUpvote() {
  postStore.votePost(post.value.id, 1)
}

function handleDownvote() {
  postStore.votePost(post.value.id, -1)
}

function voteComment(commentId, value) {
    postStore.voteComment(post.value.id, commentId, value)
}

/* 🪄 Comment toggle */
function toggleComment() {
  showComment.value = !showComment.value
  if (showComment.value) nextTick(() => textarea.value?.focus())
}

async function handleAddComment() {
  if (!newCommentText.value.trim()) return
  await postStore.addComment(post.value.id, newCommentText.value)
  newCommentText.value = ''
}

function handleShare() {
    shareMessage.value = 'Link copied!'
    setTimeout(() => { shareMessage.value = '' }, 2000)
}

/* 🖼️ Image Viewer */
function openImage(imageSrc) {
    selectedImage.value = imageSrc
    showImageViewer.value = true
}

function closeImageViewer() {
    showImageViewer.value = false
    selectedImage.value = ''
}

function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
        const date = new Date(dateStr)
        // If invalid date, return original string if it looks like "2 hours ago"
        if (isNaN(date.getTime())) return dateStr 
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
    } catch (e) {
        return dateStr
    }
}
</script>
