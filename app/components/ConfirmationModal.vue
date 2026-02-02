<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden" style="background-color: var(--secondary-color);">
      <div class="px-6 py-4 border-b" style="border-color: var(--border-color);">
        <h3 class="text-lg font-semibold" style="color: var(--text-primary);">{{ title }}</h3>
      </div>
      <div class="px-6 py-4">
        <p style="color: var(--text-secondary);">{{ message }}</p>
      </div>
      <div class="px-6 py-4 flex justify-end gap-3" style="background-color: rgba(233, 211, 134, 0.15);">
        <button 
          @click="$emit('cancel')" 
          class="px-4 py-2 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2"
          style="color: var(--text-primary); background-color: var(--secondary-color); border-color: var(--border-color); --tw-ring-color: var(--primary-color);"
        >
          Cancel
        </button>
        <button 
          @click="$emit('confirm')" 
          class="px-4 py-2 text-sm font-medium rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2"
          style="color: #fff; background-color: #000; --tw-ring-color: var(--primary-color);"
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
