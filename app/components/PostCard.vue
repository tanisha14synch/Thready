<template>
  <section :class="[cardWidth, 'my-6 p-4 border rounded-xl']" style="border-color: var(--border-color); background-color: var(--card-color);">
    <!-- 🧍 User Info & Actions -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <NuxtImg :src="post.avatar || '/images/avatars/default-avatar.jpg'" class="w-8 h-8 rounded-full" />
        <div class="flex flex-col">
          <p class="font-semibold text-xs" style="color: var(--text-primary);">{{ post.user }}</p>
          <p class="text-xs" style="color: var(--text-secondary);">Posted {{ post.postedAt }}</p>
        </div>
      </div>
      
      <!-- Post Actions -->
      <div class="flex gap-2">
        <button 
          v-if="canDeletePost" 
          @click="initiateDeletePost" 
          class="hover:opacity-80"
            style="color: var(--text-secondary);"
          title="Delete Post"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>

    <!-- 📝 Post Title & Content -->
    <div>
      <p class="text-base font-medium" style="color: var(--text-primary);">{{ post.title }}</p>
      <p v-if="post.content" class="text-sm mt-1" style="color: var(--text-primary);">{{ post.content }}</p>
    </div>

    <!-- 🖼️ Post Media -->
    <div class="mt-2">
      <NuxtImg
        v-if="post.image"
        :src="post.image"
        class="w-full h-[40vh] object-cover rounded-xl"
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
        <div class="flex items-center mt-2 gap-0 justify-center border rounded-full px-1" style="border-color: var(--border-color);">
          <button
            :class="['p-2 rounded-full text-xs', userVote === 1 ? '' : '']"
            :style="{ color: userVote === 1 ? 'var(--primary-color)' : 'var(--text-primary)' }"
            @click="handleUpvote"
          >
            <i class="fas fa-arrow-up"></i>
          </button>
          <div class="text-sm font-medium" style="color: var(--text-primary);">{{ displayedScore }}</div>
          <button
            :class="['p-2 rounded-full text-xs']"
            :style="{ color: userVote === -1 ? 'var(--primary-color)' : 'var(--text-primary)' }"
            @click="handleDownvote"
          >
            <i class="fas fa-arrow-down"></i>
          </button>
        </div>

        <!-- Comment Button -->
        <button
          class="ml-2 p-2 border rounded-full text-xs mt-2"
          style="border-color: var(--border-color); color: var(--text-primary);"
          @click="toggleComment"
        >
          <i class="fas fa-comment"></i> Comment
        </button>

        <!-- Share Button -->
        <button
          v-if="post.shareable"
          class="ml-2 p-2 border rounded-full text-xs mt-2"
          style="border-color: var(--border-color); color: var(--text-primary);"
          @click="handleShare"
        >
          <i class="fas fa-share"></i>
        </button>

        <!-- Share Status -->
        <span class="text-xs ml-2" style="color: var(--text-secondary);">{{ shareMessage }}</span>
      </div>
    </div>

    <!-- 🗨️ Comments Section -->
    <div v-if="showComment" class="mt-4 p-4 rounded-lg" style="background-color: rgba(233, 211, 134, 0.15);">
      <textarea
        ref="textarea"
        v-model="newCommentText"
        class="w-full p-2 border rounded mb-2 text-sm"
        placeholder="Write a comment..."
        rows="2"
      ></textarea>
      <div class="flex justify-end">
        <button 
          @click="handleAddComment" 
          class="px-4 py-1 rounded text-sm disabled:opacity-50"
          style="background-color: var(--primary-color); color: #000;"
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
          class="pb-3 border-b last:border-0"
          style="border-color: var(--divider-color);"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3 w-full">
              <NuxtImg :src="comment.avatar || '/images/avatars/default-avatar.jpg'" class="w-8 h-8 rounded-full" />
              <div class="w-full">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-xs">{{ comment.user }}</p>
                        <p class="text-xs" style="color: var(--text-secondary);">Commented {{ formatDate(comment.commentedAt) }}</p>
                    </div>
                    
                     <!-- Comment Actions (Vote & Delete) -->
                    <div class="flex items-center gap-3">
                        <!-- Vote -->
                        <div class="flex items-center gap-1 rounded-full px-2 py-0.5"
          style="background-color: var(--card-color); border: 1px solid var(--border-color);">
                            <button 
                                @click="voteComment(comment.id, 1)" 
                                :class="['text-xs p-1 rounded']"
                                :style="{ color: comment.userVote === 1 ? 'var(--primary-color)' : 'var(--text-secondary)' }"
                            >
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <span class="text-xs font-medium min-w-[12px] text-center">{{ comment.displayedScore || 0 }}</span>
                            <button 
                                @click="voteComment(comment.id, -1)" 
                                :class="['text-xs p-1 rounded']"
                                :style="{ color: comment.userVote === -1 ? 'var(--primary-color)' : 'var(--text-secondary)' }"
                            >
                                <i class="fas fa-arrow-down"></i>
                            </button>
                        </div>
                        
                        <!-- Delete -->
                        <button 
                            v-if="canDeleteComment(comment)" 
                            @click="initiateDeleteComment(comment.id)" 
                            class="text-xs"
          style="color: var(--text-secondary);"
                            title="Delete Comment"
                        >
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="text-sm mt-1" style="color: var(--text-primary);">{{ comment.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="mt-4 text-center text-sm" style="color: var(--text-secondary);">
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

  </section>
</template>

<script setup>
import { ref, computed, toRef, nextTick } from 'vue'
import { usePostStore } from '~/stores/posts'
import { getShopifyUser } from '~/utils/shopify'
import ConfirmationModal from '~/components/ConfirmationModal.vue'

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

const deleteModalTitle = computed(() => deleteType.value === 'post' ? 'Delete Post' : 'Delete Comment')
const deleteModalMessage = computed(() => `Do you want to delete this ${deleteType.value}?`)

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
    return comment.userId === currentUser.id || comment.user === currentUser.username
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
}

async function confirmDelete() {
    if (deleteType.value === 'post') {
        await postStore.deletePost(itemToDelete.value)
    } else if (deleteType.value === 'comment') {
        await postStore.deleteComment(post.value.id, itemToDelete.value)
    }
    cancelDelete()
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
