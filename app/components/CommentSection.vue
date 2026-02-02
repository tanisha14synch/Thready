<template>
  <div class="mt-4 border-t pt-4">
    <h3 class="font-semibold mb-3" style="color: var(--text-primary);">Comments</h3>

    <!-- New comment box -->
    <div class="flex items-start gap-3 mb-4">
      <img src="https://i.pravatar.cc/40" alt="user" class="w-8 h-8 rounded-full" />
      <div class="flex-1">
        <textarea
          v-model="newComment"
          placeholder="Add a comment..."
          class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style="border-color: var(--border-color); color: var(--text-primary); --tw-ring-color: var(--primary-color);"
        ></textarea>
        <button
          @click="addComment"
          class="mt-2 px-3 py-1 rounded text-sm hover:opacity-90"
          style="background-color: var(--primary-color); color: #000;"
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
        class="border rounded-lg p-3"
          style="background-color: var(--card-color); border-color: var(--border-color);"
      >
        <p class="text-sm font-semibold" style="color: var(--text-primary);">{{ comment.username }}</p>
        <p class="text-sm" style="color: var(--text-secondary);">{{ comment.text }}</p>
      </div>
    </div>

    <p v-else class="text-sm" style="color: var(--text-secondary);">No comments yet. Be the first to comment!</p>
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
