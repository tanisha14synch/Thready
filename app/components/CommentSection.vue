<template>
  <div class="mt-4 border-t pt-4">
    <h3 class="font-semibold text-gray-800 mb-3">Comments</h3>

    <!-- New comment box -->
    <div class="flex items-start gap-3 mb-4">
      <img src="https://i.pravatar.cc/40" alt="user" class="w-8 h-8 rounded-full" />
      <div class="flex-1">
        <textarea
          v-model="newComment"
          placeholder="Add a comment..."
          class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
        <button
          @click="addComment"
          class="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          Comment
        </button>
      </div>
    </div>

    <!-- Comment list -->
    <div v-if="comments.length > 0" class="space-y-3">
      <div
        v-for="(comment, index) in comments"
        :key="index"
        class="bg-gray-50 border rounded-lg p-3"
      >
        <p class="text-sm font-semibold text-gray-700">{{ comment.username }}</p>
        <p class="text-sm text-gray-600">{{ comment.text }}</p>
      </div>
    </div>

    <p v-else class="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  initialComments: {
    type: Array,
    default: () => [],
  },
})

const comments = ref([...useAttrs().initialComments])
const newComment = ref('')

const addComment = () => {
  if (!newComment.value.trim()) return
  comments.value.push({
    username: 'You',
    text: newComment.value.trim(),
  })
  newComment.value = ''
}
</script>
