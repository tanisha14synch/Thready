<template>
  <header
    class="w-full flex justify-between items-center bg-white border-b border-gray-200 px-4 py-2"
  >
    <div class="flex items-center gap-3">
      <button class="md:hidden" @click="toggleSidebar">
        <Menu class="w-6 h-6" />
      </button>
      <h1 class="font-bold text-lg">reddit</h1>
    </div>

    <div class="flex items-center gap-3">
      <User class="w-5 h-5" />
    </div>
  </header>
</template>

<script setup>
import { Menu, Bell, User } from 'lucide-vue-next'

const toggleSidebar = () => {
  console.log('toggle sidebar') // you can enhance this for mobile later
}
</script>
