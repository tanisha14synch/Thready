<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- Profile Header Card -->
    <div class="rounded-md mb-4 overflow-hidden" style="background-color: var(--secondary-color); border: 1px solid var(--border-color);">
      <div class="h-20" style="background: linear-gradient(to right, var(--primary-color), #d4bc6a);"></div>
      <div class="px-4 pb-4 -mt-10">
        <div
          class="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-white text-2xl font-bold inline-block"
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
          <h1 class="text-2xl font-bold" style="color: var(--text-primary);">
            {{ displayUser.firstName || displayUser.username || 'User' }} {{ displayUser.lastName || '' }}
          </h1>
          <p class="text-sm" style="color: var(--text-secondary);">u/{{ displayUser.username || 'user' }}</p>
        </div>
      </div>
    </div>

    <!-- Profile Info Card -->
    <div class="rounded-md p-4 mb-4" style="background-color: var(--secondary-color); border: 1px solid var(--border-color);">
      <h2 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">About</h2>
      <div class="space-y-3">
        <div>
          <label class="text-xs uppercase tracking-wide" style="color: var(--text-secondary);">Email</label>
          <p class="text-sm font-medium mt-1" style="color: var(--text-primary);">{{ displayUser.email || 'N/A' }}</p>
        </div>
        <div>
          <label class="text-xs uppercase tracking-wide" style="color: var(--text-secondary);">Username</label>
          <p class="text-sm font-medium mt-1" style="color: var(--text-primary);">u/{{ displayUser.username || 'user' }}</p>
        </div>
        <div v-if="displayUser.firstName || displayUser.lastName">
          <label class="text-xs uppercase tracking-wide" style="color: var(--text-secondary);">Name</label>
          <p class="text-sm font-medium mt-1" style="color: var(--text-primary);">
            {{ displayUser.firstName || '' }} {{ displayUser.lastName || '' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Joined Communities Card -->
    <div class="rounded-md p-4" style="background-color: var(--secondary-color); border: 1px solid var(--border-color);">
      <h2 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Joined Communities</h2>
      <div v-if="joinedCommunities.length > 0" class="space-y-2">
        <NuxtLink
          v-for="community in joinedCommunities"
          :key="community.id"
          :to="`/community/${community.id}`"
          class="flex items-center gap-3 p-3 rounded-md transition-colors"
          style="color: var(--text-primary);"
          @mouseenter="(e) => e.currentTarget.style.backgroundColor = 'rgba(233, 211, 134, 0.2)'"
          @mouseleave="(e) => e.currentTarget.style.backgroundColor = ''"
        >
          <div class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style="background-color: rgba(233, 211, 134, 0.4);">
            <img
              v-if="community.icon"
              :src="community.icon"
              :alt="community.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-sm font-bold" style="color: var(--text-primary);">r</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium" style="color: var(--text-primary);">{{ community.name }}</p>
            <p v-if="community.description" class="text-sm truncate" style="color: var(--text-secondary);">
              {{ community.description }}
            </p>
          </div>
        </NuxtLink>
      </div>
      <div v-else class="text-center py-8" style="color: var(--text-secondary);">
        <p class="mb-2">You haven't joined any communities yet.</p>
        <NuxtLink to="/" class="text-sm font-medium hover:underline" style="color: var(--primary-color);">
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
