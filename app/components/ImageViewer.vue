<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center"
    @click="close"
  >
    <!-- Close Button -->
    <button
      @click="close"
      class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
      aria-label="Close"
    >
      <i class="fas fa-times text-3xl"></i>
    </button>

    <!-- Image Container -->
    <div class="max-w-[90vw] max-h-[90vh] flex items-center justify-center" @click.stop>
      <img
        :src="imageSrc"
        :alt="alt"
        class="max-w-full max-h-[90vh] object-contain rounded-lg"
        @click.stop
      />
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  imageSrc: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: 'Image'
  }
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

// Close on Escape key
const handleEscape = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    window.addEventListener('keydown', handleEscape)
  } else {
    window.removeEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
})
</script>

