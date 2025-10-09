<template>
  <section :class="[
      cardWidth,'my-6 p-4 border rounded-xl border-gray-200 bg-gray-300'
    ]">
    <!-- User Info -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <NuxtImg :src="post.avatar" class="w-8 h-8 rounded-full" />
        <span class="flex items-center gap-3 justify-center">
          <p class="font-semibold text-xs">{{ post.user }}</p>
          <p class="text-xs text-gray-500">Posted {{ post.postedAt }}</p>
        </span>
      </div>
    </div>

    <!-- Post Title -->
    <p class="text-base font-medium">{{ post.title }}</p>

    <!-- Image / Video -->
    <div class="mt-2">
      <NuxtImg v-if="post.image" :src="post.image" class="w-full h-[40vh] object-cover rounded-xl" />
      <video
        v-if="post.video"
        :src="post.video"
        controls
        class="w-full h-auto rounded-xl mt-2"
      ></video>
    </div>

    <!-- Post Actions -->
    <div class="flex items-center justify-between mt-4 flex-col md:flex-row">
      <div class="flex items-center gap-1 ">
        <div class="flex items-center mt-2 gap-0 justify-center border border-gray-400 rounded-full px-1">
        <button :class="['p-2 rounded-full text-xs ', userVote === 1 ? ' text-blue-600 ' : 'text-gray-700']" @click="handleUpvote">
          <i class="fas fa-arrow-up"></i>
        </button>
        <div class="text-sm font-medium text-gray-700 ">{{ displayedScore }}</div>
        <button :class="['p-2 rounded-full text-xs ', userVote === -1 ? ' text-red-600 ' : ' text-gray-700']" @click="handleDownvote">
          <i class="fas fa-arrow-down"></i>
        </button>
      </div>
        <button
          v-if="post.shareable"
          class="ml-2 p-2 border rounded-full text-xs border-gray-400 mt-2"
          @click="handleShare"
        >
          <i class="fas fa-share"></i>
        </button>
        <span class="text-xs text-gray-500 ml-2">{{ shareMessage }}</span>
      </div>
    </div>

  </section>
</template>

<script setup>
import { ref, computed, onMounted, toRef } from 'vue'

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  cardWidth: {
    type: String,
    default: 'w-full h-auto',
  },
})

const post = toRef(props, 'post')
const cardWidth = toRef(props, 'cardWidth')

// Comments toggle
const showComments = ref(false)
const toggleComments = () => {
  showComments.value = !showComments.value
}

// Voting (persist per user in localStorage)
const VOTES_KEY = 'post_votes'
const userVote = ref(0) // -1 down, 0 none, 1 up

const loadVote = () => {
  try {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(VOTES_KEY)
    if (!raw) return
    const map = JSON.parse(raw)
    if (map && map[post.id] !== undefined) userVote.value = map[post.id]
  } catch (e) {
    // ignore
  }
}

const saveVote = () => {
  try {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(VOTES_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[post.id] = userVote.value
    localStorage.setItem(VOTES_KEY, JSON.stringify(map))
  } catch (e) {
    // ignore
  }
}

onMounted(() => loadVote())

const displayedScore = computed(() => {
  const base = Number(post.upvotes || 0)
  return base + (userVote.value === 1 ? 1 : userVote.value === -1 ? -1 : 0)
})

const handleUpvote = () => {
  if (userVote.value === 1) {
    userVote.value = 0
  } else {
    userVote.value = 1
  }
  saveVote()
}

const handleDownvote = () => {
  if (userVote.value === -1) {
    userVote.value = 0
  } else {
    userVote.value = -1
  }
  saveVote()
}

// Share (Web Share API or clipboard fallback)
const shareMessage = ref('')
const handleShare = async () => {
  try {
    const shareUrl = (typeof window !== 'undefined') ? `${window.location.origin}/community/${post.community}` : ''
    if (navigator.share) {
      await navigator.share({ title: post.title || 'Post', url: shareUrl })
      shareMessage.value = 'Shared'
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl)
      shareMessage.value = 'Link copied'
    } else {
      // fallback: create temporary input
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

