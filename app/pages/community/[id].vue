<template>
  <!-- Fills main area; left & right columns scroll independently (no shared page scroll) -->
  <div
    class="bg-white flex flex-col overflow-hidden h-full min-h-0"
    style="color: var(--text-primary); background-color: var(--background-color);"
  >
    <!-- Community Header (fixed, no scroll) -->
    <div class="relative flex-shrink-0">
      <!-- Banner Image -->
      <div class="h-[30vh] w-full overflow-hidden rounded-2xl" style="background-color: #000;">
        <NuxtImg v-if="community?.headerImage" :src="community.headerImage" alt="Community header"
          class="w-full h-full object-cover" onerror="this.style.display='none'" />
      </div>

      <!-- Community Info -->
      <div class="max-w-full mx-auto px-4 flex flex-wrap items-start justify-between ">
        <div class="flex items-end ">
          <!-- Community Icon -->
          <div class="w-25 h-25 -mt-5 md:w-20  md:h-20 rounded-full bg-white p-1 mr-4 overflow-hidden">
            <NuxtImg v-if="community?.icon" :src="community.icon" alt="icon"
              class="w-full h-full rounded-full object-cover" />
            <div v-else class="w-full h-full rounded-full flex items-center justify-center text-white" style="background-color: #000;">
              <span class="text-2xl">r</span>
            </div>
          </div>

          <!-- Community Name and Details -->
          <div class="flex-1  pb-3">
            <h1 class="text-xl font-bold">
              {{ community?.name || '' }}
            </h1>
            <div class="flex flex-wrap gap-2 mt-2">
              <span v-for="tag in community?.tags || []" :key="tag" class="text-xs px-2 py-1 rounded" style="background-color: rgba(233, 211, 134, 0.4); color: var(--text-primary);">{{ tag
                }}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <button
            class="w-full rounded-full px-3 py-2 border text-xs mt-2 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            style="border-color: var(--border-color); color: var(--text-primary);"
            :disabled="!isJoined" @click="handleCreatePost">
            <i class="fas fa-add"></i> Create Post
          </button>
        </div>
      </div>
    </div>

    <!-- Two columns: each scrolls independently -->
    <div class="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 px-4 pb-4 overflow-hidden">
      <!-- Left: Posts (own scroll) -->
      <div class="flex-1 min-h-0 overflow-y-auto space-y-4 lg:min-w-[50%]">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>

      <!-- Right: Sidebar (own scroll) -->
      <div class="w-full lg:w-[30%] flex-shrink-0 min-h-0 overflow-y-auto lg:mt-2">
        <!-- About Community -->
        <div class="rounded-md overflow-hidden mb-4"
          style="border: 1px solid var(--border-color); background-color: var(--card-color);">
          <div class="px-3 py-2 font-medium" style="background-color: var(--primary-color); color: #000;">
            {{ community?.name || 'Community' }}
          </div>
          <div class="p-3 ">
            <p class="text-sm mb-2 font-normal">{{ community?.description || '' }}</p>
            <div class="text-xs mb-2 font-normal gap-2"><i class="fa-solid fa-house"></i>
              Created {{ formatDate(community?.createdDate) }}
            </div>
            <p class="text-xs mb-4 font-normal gap-2"><i class="fa-solid fa-globe"></i> Public</p>

            <div class="flex justify-between items-center mb-3">
              <div class="">
                <span class="text-base font-bold ">{{ formatNumber(community?.members || 0) }}</span>
                <p class="text-xs" style="color: var(--text-secondary);">Members</p>
              </div>
              <div class="w-px h-8 mx-3 " style="background-color: var(--divider-color);"></div>
              <div class="w-20">
                <span class="text-base font-bold">{{ formatNumber(community?.online || 0) }}</span>
                <p class="text-xs" style="color: var(--text-secondary);">Online</p>
              </div>
            </div>

            <button
              class="w-full py-1 rounded-full border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style="background-color: var(--primary-color); border-color: var(--border-color); color: #000;" @click="toggleJoin">
              <i class="fas" :class="isJoined ? 'fa-check' : 'fa-add'"></i>
              {{ isJoined ? 'Joined' : 'Join Community' }}
            </button>
          </div>
        </div>

        <!-- Moderators -->
        <!-- <div class="rounded-md overflow-hidden mb-4">
          <div class="px-3 py-2 font-medium">Moderators</div>
          <div class="p-3">
            <div v-for="mod in community?.moderators || []" :key="mod.username" class="flex items-center gap-2 mb-2">
              <NuxtImg :src="mod.avatar" class="w-7 h-7 rounded-full" />
              <div class="text-sm">{{ mod.username }}</div>
            </div>
          </div>
        </div> -->

        <!-- Community Rules -->
        <!-- <div class="rounded-md overflow-hidden" >
          <div class="px-3 py-2 text-white font-medium">
            r/{{ community?.id || '' }} Rules
          </div>
          <div class="p-3">
            <ul class="text-sm divide-y" style="border-color: var(--divider-color);">
              <li class="py-2">1. Be respectful to others</li>
              <li class="py-2">2. No spam or self-promotion</li>
              <li class="py-2">3. Use appropriate tags</li>
            </ul>
          </div>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMainStore } from '~/stores/main'
import { useCommunityStore } from '~/stores/communities'
import { usePostStore } from '~/stores/posts'
import PostCard from '~/components/PostCard.vue'

const route = useRoute()
const router = useRouter()
const mainStore = useMainStore()
const communityStore = useCommunityStore()
const postStore = usePostStore()

const communityId = computed(() => route.params.id)
const community = ref(null)
const loading = computed(() => communityStore.loading || postStore.loading)
const error = computed(() => communityStore.error || postStore.error)
const isJoined = computed(() => mainStore.isJoined(communityId.value))

// derive posts for this community only (even if global filter changes elsewhere)
const posts = computed(() => postStore.getPostsByCommunity(communityId.value)?.value ?? [])

// Format numbers for display (e.g., 1.2k)
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'm'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num
}

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date'

  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Load community data
const loadCommunity = async () => {
  if (communityId.value) {
    // ensure communities are loaded in the community store (it reads the JSON)
    await communityStore.fetchCommunities()
    const communityData = communityStore.getCommunityById(communityId.value)
    community.value = communityData.value
    mainStore.setCommunity(communityId.value)

    // Fetch posts for this community from the store
    await postStore.fetchPostsByCommunity(communityId.value)
  }
}

// Load data on component mount
onMounted(async () => {
  await loadCommunity()
})

// Watch for route changes
watch(communityId, async () => {
  await loadCommunity()
})

const toggleJoin = () => {
  if (!communityId.value) return
  if (isJoined.value) {
    mainStore.leaveCommunity(communityId.value)
  } else {
    mainStore.joinCommunity(communityId.value)
  }
}

const handleCreatePost = () => {
  if (!communityId.value) return
  if (!isJoined.value) return
  router.push(`/create-post?c=${communityId.value}`)
}
</script>