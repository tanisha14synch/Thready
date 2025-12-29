<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      </div>
      <div class="px-6 py-4">
        <p :class="message.includes('Unauthorized') || message.includes('Failed') ? 'text-red-600 font-medium' : 'text-gray-600'">{{ message }}</p>
      </div>
      <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
        <button 
          @click="$emit('cancel')" 
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button 
          @click="$emit('confirm')" 
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, default: 'Are you sure you want to proceed?' }
})

defineEmits(['confirm', 'cancel'])
</script>
