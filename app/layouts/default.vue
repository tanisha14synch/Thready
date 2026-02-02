<template>
  <div class="min-h-screen flex flex-col" style="background-color: var(--background-color);">
    <!-- Header (always full width) -->
    <Header />

    <!-- Main content area: pt-12 to clear fixed header (h-12) -->
    <div class="flex flex-1 min-h-0 pt-12">
      <!-- Sidebar -->
      <Sidebar />

      <!-- Page content: main never scrolls; scroll happens inside wrapper or inside page -->
      <main class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div class="h-full min-h-0 overflow-y-auto">
          <NuxtPage />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import Header from '~/components/Header.vue'
import Sidebar from '~/components/Sidebar.vue'
</script>
