import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import communities from '~/data/communities.json'

export const usePostStore = defineStore('postStore', () => {
  // Build posts list from communities.json
  const buildPostsFromCommunities = () => {
    const list = []
    communities.forEach((c) => {
      if (Array.isArray(c.posts)) {
        c.posts.forEach((p, idx) => {
          list.push({
            id: `${c.id}-${p.id || idx}`,
            community: c.id,
            user: p.user || 'Unknown',
            avatar: p.avatar || '',
            postedAt: p.postedAt || '',
            title: p.title || '',
            content: p.content || '',
            upvotes: p.upvotes || 0,
            downvotes: p.downvotes || 0,
            comments: p.comments || 0,
            commentsList: p.commentsList || [],
            image: p.image || null,
            video: p.video || null,
            shareable: p.shareable || false,
          })
        })
      }
    })
    return list
  }

  const samplePosts = buildPostsFromCommunities()

  const posts = ref(samplePosts)
  const loading = ref(false)
  const error = ref(null)

  // Fetch all posts from backend (mocked)
  const fetchPosts = async () => {
    loading.value = true
    error.value = null
    try {
      setTimeout(() => {
        posts.value = samplePosts
        loading.value = false
      }, 500)
    } catch (err) {
      error.value = err.message || 'Failed to fetch posts'
      loading.value = false
    }
  }

  // Fetch posts for a specific community
  const fetchPostsByCommunity = async (communityId) => {
    loading.value = true
    error.value = null
    try {
      setTimeout(() => {
        posts.value = samplePosts.filter((p) => p.community === communityId)
        loading.value = false
      }, 500)
    } catch (err) {
      error.value = err.message || `Failed to fetch posts for ${communityId}`
      loading.value = false
    }
  }

  // Create a new post
  const createPost = async (postData) => {
    loading.value = true
    error.value = null
    try {
      setTimeout(() => {
        const newPost = {
          id: Date.now().toString(),
          ...postData,
          postedAt: 'Just now',
          upvotes: 0,
          downvotes: 0,
          comments: 0,
          commentsList: [],
          image: postData.image || null,
          video: postData.video || null,
          shareable: postData.shareable || false,
        }
        posts.value.unshift(newPost)
        loading.value = false
      }, 500)
    } catch (err) {
      error.value = err.message || 'Failed to create post'
      loading.value = false
    }
  }

  // Computed posts by community
  const getPostsByCommunity = (communityName) => {
    return computed(() => posts.value.filter((p) => p.community === communityName))
  }

  return {
    posts,
    loading,
    error,
    getPostsByCommunity,
    fetchPosts,
    fetchPostsByCommunity,
    createPost,
  }
})
