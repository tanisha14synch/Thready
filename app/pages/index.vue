<template>
  <div class="px-4 pb-8 w-full lg:w-[57.5vw]">
    <!-- HOME Section -->
    <div v-if="store.selectedSection === 'home'">
      <div v-if="loading" class="py-8 text-center text-gray-500">Loading posts...</div>
      <div v-else>
        <div v-if="allPosts.length === 0" class="py-8 text-center text-gray-500">No posts yet.</div>
        <div v-else class="space-y-4">
          <PostCard v-for="post in allPosts" :key="post.id" :post="post" cardWidth=" h-auto" />
        </div>
      </div>
    </div>

    <!-- POPULAR Section -->
    <div v-if="store.selectedSection === 'popular'">
      <div v-if="loading" class="py-8 text-center text-gray-500">Loading posts...</div>
      <div v-else>
        <div v-if="popularPosts.length === 0" class="py-8 text-center text-gray-500">No popular posts yet.</div>
        <div v-else class="space-y-4">
          <PostCard v-for="post in popularPosts" :key="post.id" :post="post" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useMainStore } from '~/stores/main'
import { usePostStore } from '~/stores/posts'
import PostCard from '~/components/PostCard.vue'

const store = useMainStore()
const postStore = usePostStore()

const loading = computed(() => postStore.loading)

const allPosts = computed(() => postStore.posts)

// Popular: top 5 posts by upvotes
const popularPosts = computed(() => {
  return [...postStore.posts].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 5)
})

onMounted(() => {
  postStore.fetchPosts()
})
</script>
