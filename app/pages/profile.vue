<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- Profile Header Card -->
    <div class="bg-white border border-gray-300 rounded-md mb-4 overflow-hidden">
      <div class="h-20" style="background: linear-gradient(to right, #E9D386, #D4C070);"></div>
      <div class="px-4 pb-4 -mt-10">
        <div
          class="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-black text-2xl font-bold inline-block"
            :style="`background-color: ${displayUser.avatarColor || '#E9D386'}`"
        >
          <img
            v-if="displayUser.profileImage || displayUser.avatar"
            :src="displayUser.profileImage || displayUser.avatar"
            :alt="displayUser.firstName || displayUser.username"
            class="w-full h-full rounded-full object-cover"
          />
          <span v-else>
            {{ (displayUser.firstName?.[0] || displayUser.username?.[0] || 'U') + (displayUser.lastName?.[0] || '') }}
          </span>
        </div>
        <div class="mt-2">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ displayUser.firstName || displayUser.username || 'User' }} {{ displayUser.lastName || '' }}
          </h1>
          <p class="text-sm text-gray-500">u/{{ displayUser.username || 'user' }}</p>
        </div>
      </div>
    </div>

    <!-- Profile Info Card -->
    <div class="bg-white border border-gray-300 rounded-md p-4 mb-4">
      <h2 class="text-lg font-semibold mb-4 text-gray-900">About</h2>
      <div class="space-y-3">
        <div>
          <label class="text-xs text-gray-500 uppercase tracking-wide">Email</label>
          <p class="text-sm font-medium text-gray-900 mt-1">{{ displayUser.email || 'N/A' }}</p>
        </div>
        <div>
          <label class="text-xs text-gray-500 uppercase tracking-wide">Username</label>
          <p class="text-sm font-medium text-gray-900 mt-1">u/{{ displayUser.username || 'user' }}</p>
        </div>
        <div v-if="displayUser.firstName || displayUser.lastName">
          <label class="text-xs text-gray-500 uppercase tracking-wide">Name</label>
          <p class="text-sm font-medium text-gray-900 mt-1">
            {{ displayUser.firstName || '' }} {{ displayUser.lastName || '' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Joined Communities Card -->
    <div class="bg-white border border-gray-300 rounded-md p-4">
      <h2 class="text-lg font-semibold mb-4 text-gray-900">Joined Communities</h2>
      <div v-if="joinedCommunities.length > 0" class="space-y-2">
        <NuxtLink
          v-for="community in joinedCommunities"
          :key="community.id"
          :to="`/community/${community.id}`"
          class="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors"
        >
          <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
            <img
              v-if="community.icon"
              :src="community.icon"
              :alt="community.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-gray-600 text-sm font-bold">r</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900">{{ community.name }}</p>
            <p v-if="community.description" class="text-sm text-gray-500 truncate">
              {{ community.description }}
            </p>
          </div>
        </NuxtLink>
      </div>
      <div v-else class="text-center py-8 text-gray-500">
        <p class="mb-2">You haven't joined any communities yet.</p>
        <NuxtLink to="/" class="text-blue-500 hover:underline text-sm font-medium">
          Browse communities
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMainStore } from '~/stores/main'
import { useCommunityStore } from '~/stores/communities'
import { getShopifyUser } from '~/utils/shopify'

const mainStore = useMainStore()
const communityStore = useCommunityStore()

// Default user to show when no one is logged in
const defaultUser = {
  id: 'default-user',
  shopifyCustomerId: 'shopify_demo_12345',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  username: 'johndoe',
  profileImage: null,
  avatarColor: '#E9D386',
  communityId: 'the_bar_wardrobe',
}

// Get Shopify user if available
const shopifyUser = computed(() => {
  if (import.meta.client) {
    return getShopifyUser()
  }
  return null
})

// Use actual user if logged in, otherwise show default user
const displayUser = computed(() => {
  return mainStore.user || shopifyUser.value || defaultUser
})

const joinedCommunities = computed(() => {
  if (!mainStore.joinedCommunities || mainStore.joinedCommunities.length === 0) {
    // If using default user, show their default community
    if (!mainStore.user && !shopifyUser.value && defaultUser.communityId) {
      const comm = communityStore.getCommunityById(defaultUser.communityId)
      return comm?.value ? [comm.value] : []
    }
    return []
  }
  return mainStore.joinedCommunities
    .map((id) => {
      const comm = communityStore.getCommunityById(id)
      return comm?.value || null
    })
    .filter(Boolean)
})
</script>
