import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getShopifyHeaders, getShopifyUser } from '~/utils/shopify'
import postsSeed from '../data/posts.json'

export const usePostStore = defineStore('postStore', () => {
  const getApiUrl = () =>
    (typeof window !== 'undefined' && window.__API_BASE__ !== undefined)
      ? window.__API_BASE__
      : (import.meta.env?.VITE_API_BASE || import.meta.env?.NUXT_PUBLIC_API_BASE || '')

  // State
  const allPosts = ref([])
  const filter = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const useLocal = ref(false) // when backend is unreachable, stay local to avoid repeated errors
  
  // Computed: Displayed posts based on filter
  const posts = computed(() => {
    if (filter.value) {
      return allPosts.value.filter(p => p.communityId === filter.value || p.community === filter.value)
    }
    return allPosts.value
  })

  // Helpers
  const normalizePost = (p) => ({
    id: p.id,
    communityId: p.communityId || p.community,
    community: p.communityId || p.community,
    title: p.title || '',
    content: p.content || '',
    image: p.image || '',
    video: p.video || '',
    user: p.user || 'Anonymous',
    userId: p.userId || 'legacy',
    avatar: p.avatar || '/images/avatars/default-avatar.jpg',
    upvotes: p.upvotes || 0,
    downvotes: p.downvotes || 0,
    postedAt: p.postedAt || new Date().toISOString(),
    shareable: p.shareable ?? true,
    comments: p.commentsList ? p.commentsList.length : p.comments || 0,
    commentsList: p.commentsList || [],
    userVote: p.userVote || 0,
  })

  // Helper to get headers with auth
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      ...getShopifyHeaders()
    }
  }

  // Actions

  // Fetch all posts (reset filter)
  const fetchPosts = async () => {
    loading.value = true
    error.value = null
    try {
      if (useLocal.value) {
        allPosts.value = postsSeed.map(normalizePost)
        filter.value = null
        return
      }
      const response = await fetch(`${getApiUrl()}/posts`, {
        headers: getHeaders()
      })
      if (!response.ok) throw new Error('Failed to fetch posts')
      const data = await response.json()
      
      allPosts.value = data.map(normalizePost)
      filter.value = null
    } catch (err) {
      // Fallback to local seed when server is down
      useLocal.value = true
      allPosts.value = postsSeed.map(normalizePost)
      error.value = err.message || 'Using local posts (server unreachable)'
    } finally {
      loading.value = false
    }
  }

  // Fetch posts for a specific community
  const fetchPostsByCommunity = async (communityId) => {
    loading.value = true
    error.value = null
    try {
      if (useLocal.value) {
        const local = postsSeed
          .map(normalizePost)
          .filter(p => p.communityId === communityId || p.community === communityId)
        // Merge into state
        local.forEach(post => {
          const index = allPosts.value.findIndex(p => p.id === post.id)
          if (index !== -1) allPosts.value[index] = post
          else allPosts.value.push(post)
        })
        filter.value = communityId
        return
      }
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/posts?community=${communityId}`, {
        headers: getHeaders()
      })
      if (!response.ok) throw new Error('Failed to fetch posts')
      const data = await response.json()
      
      // Merge fetched posts
      data.forEach(post => {
        const index = allPosts.value.findIndex(p => p.id === post.id)
        if (index !== -1) {
          allPosts.value[index] = normalizePost(post)
        } else {
          allPosts.value.push(normalizePost(post))
        }
      })
      filter.value = communityId
    } catch (err) {
      // Fallback to local seed for this community
      useLocal.value = true
      const local = postsSeed
        .map(normalizePost)
        .filter(p => p.communityId === communityId || p.community === communityId)
      // Merge into state
      local.forEach(post => {
        const index = allPosts.value.findIndex(p => p.id === post.id)
        if (index !== -1) allPosts.value[index] = post
        else allPosts.value.push(post)
      })
      filter.value = communityId
      error.value = err.message || `Using local posts for ${communityId} (server unreachable)`
    } finally {
      loading.value = false
    }
  }

  const getPostsByCommunity = (communityId) => {
    return computed(() => allPosts.value.filter((p) => p.communityId === communityId || p.community === communityId))
  }

  // Create a new post
  const createPost = async (postData) => {
    loading.value = true
    error.value = null
    try {
      if (useLocal.value) {
        const user = getShopifyUser() || { id: 'demo-user', username: 'DemoUser', avatar: '/images/avatars/default-avatar.jpg' }
        const newPost = normalizePost({
          ...postData,
          id: `local-${Date.now()}`,
          user: user.username,
          userId: user.id,
          avatar: user.avatar,
          commentsList: [],
          comments: 0
        })
        allPosts.value.unshift(newPost)
        return newPost
      }
      const user = getShopifyUser() || { id: 'demo-user', username: 'DemoUser', avatar: '/images/avatars/default-avatar.jpg' }
      const response = await fetch(`${getApiUrl()}/posts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...postData,
          user: user.username,
          avatar: user.avatar
        })
      })
      
      if (!response.ok) throw new Error('Failed to create post')
      const newPost = await response.json()
      
      allPosts.value.unshift(normalizePost(newPost))
      return newPost
    } catch (err) {
      // Fallback: create locally so UX still works offline
      useLocal.value = true
      const user = getShopifyUser() || { id: 'demo-user', username: 'DemoUser', avatar: '/images/avatars/default-avatar.jpg' }
      const newPost = normalizePost({
        ...postData,
        id: `local-${Date.now()}`,
        user: user.username,
        userId: user.id,
        avatar: user.avatar,
        commentsList: [],
        comments: 0
      })
      allPosts.value.unshift(newPost)
      error.value = err.message || 'Created locally (server unreachable)'
      return newPost
    } finally {
      loading.value = false
    }
  }

  // Vote on a post
  const votePost = async (postId, value) => {
    const postIndex = allPosts.value.findIndex(p => p.id === postId)
    if (postIndex === -1) return

    const post = allPosts.value[postIndex]
    const originalPost = { ...post } // Snapshot for revert

    // Optimistic Update
    const previousVote = post.userVote || 0
    let upvotes = post.upvotes || 0
    let downvotes = post.downvotes || 0

    if (previousVote === value) {
        // Toggle off
        post.userVote = 0
        if (value === 1) upvotes--
        else downvotes--
    } else {
        // Change vote
        post.userVote = value
        if (previousVote === 1) upvotes--
        else if (previousVote === -1) downvotes--
        
        if (value === 1) upvotes++
        else downvotes++
    }
    
    post.upvotes = upvotes
    post.downvotes = downvotes
    allPosts.value[postIndex] = { ...post } // Trigger reactivity

    try {
      if (useLocal.value) {
        return
      }
      const response = await fetch(`${getApiUrl()}/posts/${postId}/vote`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ value })
      })

      if (!response.ok) throw new Error('Vote failed')
      
      // Update with server response to be sure
      const updatedPost = await response.json()
      // Preserve comments which might not be fully returned or handle correctly
      const commentsList = post.commentsList
      allPosts.value[postIndex] = {
        ...updatedPost,
        community: updatedPost.communityId,
        commentsList,
        comments: updatedPost.comments.length || commentsList.length,
        userVote: post.userVote
      }
    } catch (err) {
      console.error('Vote failed, reverting', err)
      allPosts.value[postIndex] = originalPost
    }
  }

  // Vote on a comment
  const voteComment = async (postId, commentId, value) => {
    const postIndex = allPosts.value.findIndex(p => p.id === postId)
    if (postIndex === -1) return
    
    const post = allPosts.value[postIndex]
    const commentIndex = post.commentsList.findIndex(c => c.id === commentId)
    if (commentIndex === -1) return

    const comment = post.commentsList[commentIndex]
    const originalComment = { ...comment }

    // Optimistic Update for Comment
    const previousVote = comment.userVote || 0
    let score = comment.displayedScore || 0

    if (previousVote === value) {
        // Toggle off
        comment.userVote = 0
        if (value === 1) score--
        else score++ // Removing downvote increases score? Assuming score = up - down
    } else {
        // Change vote
        comment.userVote = value
        if (previousVote === 1) score--
        else if (previousVote === -1) score++
        
        if (value === 1) score++
        else score--
    }

    comment.displayedScore = score
    // Trigger reactivity
    post.commentsList[commentIndex] = { ...comment }
    allPosts.value[postIndex] = { ...post }

    try {
        if (useLocal.value) {
            allPosts.value[postIndex] = { ...post }
            return
        }
        const response = await fetch(`${getApiUrl()}/comments/${commentId}/vote`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ value })
        })
        if (!response.ok) throw new Error('Comment vote failed')
    } catch (err) {
        console.error('Comment vote failed, reverting', err)
        post.commentsList[commentIndex] = originalComment
        allPosts.value[postIndex] = { ...post }
    }
  }

  // Add Comment
  const addComment = async (postId, text) => {
    loading.value = true
    try {
      const user = getShopifyUser() || { username: 'Anonymous', avatar: '' }
      
      if (useLocal.value) throw new Error('local-mode')

      const response = await fetch(`${getApiUrl()}/posts/${postId}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          user: user.username,
          avatar: user.avatar,
          text
        })
      })
      
      if (!response.ok) throw new Error('Failed to add comment')
      const newComment = await response.json()
      
      const index = allPosts.value.findIndex(p => p.id === postId)
      if (index !== -1) {
        const post = allPosts.value[index]
        const updatedComments = [...(post.commentsList || []), newComment]
        
        allPosts.value[index] = {
          ...post,
          comments: updatedComments.length,
          commentsList: updatedComments
        }
      }
      return newComment
    } catch (err) {
      // Fallback: add comment locally
      useLocal.value = true
      const user = getShopifyUser() || { id: 'demo-user', username: 'Anonymous', avatar: '' }
      const localComment = {
        id: `c-${Date.now()}`,
        user: user.username,
        userId: user.id || 'demo-user',
        avatar: user.avatar,
        text,
        commentedAt: new Date().toISOString(),
        displayedScore: 1,
        userVote: 0
      }
      const index = allPosts.value.findIndex(p => p.id === postId)
      if (index !== -1) {
        const post = allPosts.value[index]
        const updatedComments = [...(post.commentsList || []), localComment]
        allPosts.value[index] = {
          ...post,
          comments: updatedComments.length,
          commentsList: updatedComments
        }
      }
      error.value = err.message || 'Added comment locally (server unreachable)'
      return localComment
    } finally {
      loading.value = false
    }
  }

  // Update Post
  const updatePost = async (postId, updates) => {
    loading.value = true
    try {
      if (useLocal.value) {
        const index = allPosts.value.findIndex(p => p.id === postId)
        if (index !== -1) {
          const current = allPosts.value[index]
          allPosts.value[index] = { 
              ...current,
              ...updates
          }
          return allPosts.value[index]
        }
        return
      }
      const response = await fetch(`${getApiUrl()}/posts/${postId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error('Failed to update post')
      const updatedPost = await response.json()
      
      const index = allPosts.value.findIndex(p => p.id === postId)
      if (index !== -1) {
        // Preserve local state like comments list which might not be in update response
        const current = allPosts.value[index]
        allPosts.value[index] = { 
            ...updatedPost,
            community: updatedPost.communityId,
            commentsList: current.commentsList,
            comments: current.comments,
            userVote: current.userVote
        }
      }
      return updatedPost
    } catch (err) {
      // Fallback local update
      useLocal.value = true
      const index = allPosts.value.findIndex(p => p.id === postId)
      if (index !== -1) {
        const current = allPosts.value[index]
        allPosts.value[index] = { 
            ...current,
            ...updates
        }
      }
      error.value = err.message || 'Updated locally (server unreachable)'
      return allPosts.value.find(p => p.id === postId)
    } finally {
      loading.value = false
    }
  }

  // Delete Post
  const deletePost = async (postId) => {
    loading.value = true
    try {
      if (useLocal.value) {
        allPosts.value = allPosts.value.filter(p => p.id !== postId)
        return
      }
      const response = await fetch(`${getApiUrl()}/posts/${postId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!response.ok) throw new Error('Failed to delete post')
      
      // Remove from state
      allPosts.value = allPosts.value.filter(p => p.id !== postId)
    } catch (err) {
      // Fallback local delete
      useLocal.value = true
      allPosts.value = allPosts.value.filter(p => p.id !== postId)
      error.value = err.message || 'Deleted locally (server unreachable)'
    } finally {
      loading.value = false
    }
  }

  // Update Comment
  const updateComment = async (postId, commentId, text) => {
     try {
        if (useLocal.value) {
            const postIndex = allPosts.value.findIndex(p => p.id === postId)
            if (postIndex !== -1) {
                const post = allPosts.value[postIndex]
                const commentIndex = post.commentsList.findIndex(c => c.id === commentId)
                if (commentIndex !== -1) {
                    post.commentsList[commentIndex] = {
                        ...post.commentsList[commentIndex],
                        text
                    }
                    allPosts.value[postIndex] = { ...post }
                }
            }
            return
        }
        const response = await fetch(`${getApiUrl()}/comments/${commentId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ text })
        })
        if (!response.ok) throw new Error('Failed to update comment')
        const updatedComment = await response.json()
        
        const postIndex = allPosts.value.findIndex(p => p.id === postId)
        if (postIndex !== -1) {
            const post = allPosts.value[postIndex]
            const commentIndex = post.commentsList.findIndex(c => c.id === commentId)
            if (commentIndex !== -1) {
                post.commentsList[commentIndex] = {
                    ...post.commentsList[commentIndex],
                    text: updatedComment.text
                }
                allPosts.value[postIndex] = { ...post }
            }
        }
     } catch (err) {
        // Fallback local update
        const postIndex = allPosts.value.findIndex(p => p.id === postId)
        if (postIndex !== -1) {
            const post = allPosts.value[postIndex]
            const commentIndex = post.commentsList.findIndex(c => c.id === commentId)
            if (commentIndex !== -1) {
                post.commentsList[commentIndex] = {
                    ...post.commentsList[commentIndex],
                    text
                }
                allPosts.value[postIndex] = { ...post }
            }
        }
        error.value = err.message || 'Updated comment locally (server unreachable)'
     }
  }

  // Delete Comment
  const deleteComment = async (postId, commentId) => {
    try {
        if (useLocal.value) {
            const postIndex = allPosts.value.findIndex(p => p.id === postId)
            if (postIndex !== -1) {
                const post = allPosts.value[postIndex]
                const updatedComments = post.commentsList.filter(c => c.id !== commentId)
                allPosts.value[postIndex] = {
                    ...post,
                    commentsList: updatedComments,
                    comments: updatedComments.length
                }
            }
            return
        }
        const response = await fetch(`${getApiUrl()}/comments/${commentId}`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        if (!response.ok) throw new Error('Failed to delete comment')
        
        const postIndex = allPosts.value.findIndex(p => p.id === postId)
        if (postIndex !== -1) {
            const post = allPosts.value[postIndex]
            const updatedComments = post.commentsList.filter(c => c.id !== commentId)
            allPosts.value[postIndex] = {
                ...post,
                commentsList: updatedComments,
                comments: updatedComments.length
            }
        }
    } catch (err) {
        // Fallback local delete
        useLocal.value = true
        const postIndex = allPosts.value.findIndex(p => p.id === postId)
        if (postIndex !== -1) {
            const post = allPosts.value[postIndex]
            const updatedComments = post.commentsList.filter(c => c.id !== commentId)
            allPosts.value[postIndex] = {
                ...post,
                commentsList: updatedComments,
                comments: updatedComments.length
            }
        }
        error.value = err.message || 'Deleted comment locally (server unreachable)'
    }
  }

  return {
    allPosts,
    posts,
    loading,
    error,
    fetchPosts,
    fetchPostsByCommunity,
    getPostsByCommunity,
    createPost,
    votePost,
    voteComment,
    addComment,
    updatePost,
    deletePost,
    updateComment,
    deleteComment
  }
}, {
  persist: true
})

