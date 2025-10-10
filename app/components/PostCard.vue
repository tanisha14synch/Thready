<template>
  <section :class="[cardWidth, 'my-6 p-4 border rounded-xl border-gray-200 bg-gray-300']">
    <!-- 🧍 User Info -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <NuxtImg :src="post.avatar" class="w-8 h-8 rounded-full" />
        <div class="flex flex-col">
          <p class="font-semibold text-xs">{{ post.user }}</p>
          <p class="text-xs text-gray-500">Posted {{ post.postedAt }}</p>
        </div>
      </div>
    </div>

    <!-- 📝 Post Title -->
    <p class="text-base font-medium">{{ post.title }}</p>

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

    <!-- 💬 Comment Section -->
    <div v-show="showComment" class="mt-3 border rounded-lg border-gray-300 p-2">
      <textarea
        ref="textarea"
        class="w-full p-2 border border-gray-300 rounded-lg resize-none bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400"
        rows="3"
        placeholder="Add a comment..."
      ></textarea>

      <div class="flex justify-end mt-2 gap-2">
        <button
          class="px-3 py-1 border border-gray-200 rounded-full bg-gray-200 hover:bg-gray-300"
          @click="showComment = false"
        >
          Cancel
        </button>
        <button
          class="px-3 py-1 border rounded-full bg-yellow-400 text-white hover:bg-yellow-500"
        >
          Comment
        </button>
      </div>

      <!-- 🔁 Loop through comments -->
      <div v-if="comments.length" class="mt-4 space-y-4">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="pb-3"
        >
          <div class="flex items-center gap-3 mb-2">
            <NuxtImg :src="comment.avatar" class="w-8 h-8 rounded-full" />
            <div>
              <p class="font-semibold text-xs">{{ comment.user }}</p>
              <p class="text-xs text-gray-500">Commented {{ comment.commentedAt }}</p>
            </div>
          </div>

          <p class="text-sm font-medium text-gray-800">{{ comment.text }}</p>

          <!-- 🗳️ Comment Actions -->
          <div class="flex items-center gap-2 mt-3">
            <div class="flex items-center border border-gray-400 rounded-full px-1">
              <button
                :class="['p-2 rounded-full text-xs', comment.userVote === 1 ? 'text-blue-600' : 'text-gray-700']"
              >
                <i class="fas fa-arrow-up"></i>
              </button>
              <div class="text-sm font-medium text-gray-700">
                {{ comment.displayedScore }}
              </div>
              <button
                :class="['p-2 rounded-full text-xs', comment.userVote === -1 ? 'text-red-600' : 'text-gray-700']"
              >
                <i class="fas fa-arrow-down"></i>
              </button>
            </div>

            <button
              v-if="comment.shareable"
              class="ml-2 p-2 border rounded-full text-xs border-gray-400"
            >
              <i class="fas fa-share"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-xs text-gray-500 mt-3 text-center">
        No comments yet. Be the first to comment!
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, toRef, nextTick } from 'vue'

/* 🧩 Props */
const props = defineProps({
  post: { type: Object, required: true },
  cardWidth: { type: String, default: 'w-full h-auto' },
})

/* 🧠 Reactive State */
const post = toRef(props, 'post')
const cardWidth = toRef(props, 'cardWidth')
const showComment = ref(false)
const textarea = ref(null)
const userVote = ref(0)
const shareMessage = ref('')

/* 💬 Computed: comments */
const comments = computed(() => post.value?.comments ?? [])

/* 🪄 Comment toggle */
function toggleComment() {
  showComment.value = !showComment.value
  if (showComment.value) nextTick(() => textarea.value?.focus())
}

/* 🗳️ Voting System */
const VOTES_KEY = 'post_votes'

function loadVote() {
  if (typeof window === 'undefined') return
  const map = JSON.parse(localStorage.getItem(VOTES_KEY) || '{}')
  if (map[post.value.id] !== undefined) userVote.value = map[post.value.id]
}

function saveVote() {
  if (typeof window === 'undefined') return
  const map = JSON.parse(localStorage.getItem(VOTES_KEY) || '{}')
  map[post.value.id] = userVote.value
  localStorage.setItem(VOTES_KEY, JSON.stringify(map))
}

onMounted(loadVote)

const displayedScore = computed(() => {
  const base = Number(post.value.upvotes || 0)
  return base + (userVote.value === 1 ? 1 : userVote.value === -1 ? -1 : 0)
})

function handleUpvote() {
  userVote.value = userVote.value === 1 ? 0 : 1
  saveVote()
}

function handleDownvote() {
  userVote.value = userVote.value === -1 ? 0 : -1
  saveVote()
}

/* 📤 Share Function */
async function handleShare() {
  try {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/community/${post.value.community}`
        : ''
    if (navigator.share) {
      await navigator.share({ title: post.value.title || 'Post', url: shareUrl })
      shareMessage.value = 'Shared'
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl)
      shareMessage.value = 'Link copied'
    } else {
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      shareMessage.value = 'Link copied'
    }
  } catch (e) {
    shareMessage.value = 'Failed to share'
  }
  setTimeout(() => (shareMessage.value = ''), 2000)
}
</script>
