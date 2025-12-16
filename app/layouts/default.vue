<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Header (always full width, fixed) -->
    <Header />

    <!-- Main content area -->
    <div class="flex flex-1 relative mt-12">
      <!-- Sidebar -->
      <Sidebar />

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto md:ml-64">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup>
import Header from '~/components/Header.vue'
import Sidebar from '~/components/Sidebar.vue'
</script>
