import type { PrismaClient } from '@prisma/client'
import type { FastifyRequest, FastifyReply } from 'fastify'

interface GetPostsQuery {
  community?: string
}

interface CreatePostBody {
  communityId: string
  user: string
  avatar?: string
  title: string
  content?: string
  image?: string
  video?: string
}

interface UpdatePostBody {
  title?: string
  content?: string
  image?: string
  video?: string
}

interface CommentBody {
  user: string
  avatar?: string
  text: string
}

interface VoteBody {
  value: number
}

export class PostController {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all posts, optionally filtered by community
   */
  async getPosts(request: FastifyRequest<{ Querystring: GetPostsQuery }>, reply: FastifyReply) {
    const { community } = request.query
    const userId = request.headers['x-user-id'] as string | undefined
    
    const where = community ? { communityId: community } : {}
    
    try {
      const posts = await this.prisma.post.findMany({
        where,
        include: {
          comments: {
            include: {
              votes: userId ? { where: { user: userId } } : false
            }
          },
          votes: userId ? { where: { user: userId } } : false
        },
        orderBy: {
          postedAt: 'desc'
        }
      })
      
      return posts.map((p: any) => {
        // Determine user's vote on the post
        let userVote = 0
        if (p.votes && p.votes.length > 0) {
          userVote = p.votes[0].value
        }

        // Map comments to include user's vote on them
        const commentsList = p.comments.map((c: any) => {
          let commentUserVote = 0
          if (c.votes && c.votes.length > 0) {
            commentUserVote = c.votes[0].value
          }
          return {
            ...c,
            userVote: commentUserVote,
            votes: undefined
          }
        })

        return {
          ...p,
          community: p.communityId,
          comments: p.comments.length,
          commentsList: commentsList,
          userVote: userVote,
          votes: undefined
        }
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: 'Failed to fetch posts' })
    }
  }

  /**
   * Create a new post
   */
  async createPost(
    request: FastifyRequest<{ Body: CreatePostBody }>,
    reply: FastifyReply,
    userId: string
  ) {
    const { communityId, user, avatar, title, content, image, video } = request.body
    
    // Validate required fields
    if (!title || !communityId) {
      return reply.code(400).send({ error: 'Title and communityId are required' })
    }
    
    try {
      // Check if community exists
      const community = await this.prisma.community.findUnique({
        where: { id: communityId }
      })
      
      if (!community) {
        return reply.code(404).send({ error: 'Community not found' })
      }
      
      const post = await this.prisma.post.create({
        data: {
          communityId,
          userId,
          user,
          avatar,
          title,
          content,
          image,
          video
        }
      })
      
      return {
        ...post,
        community: post.communityId,
        comments: 0,
        commentsList: []
      }
    } catch (error: any) {
      request.log.error(error)
      return reply.code(400).send({ error: 'Failed to create post', details: error.message })
    }
  }

  /**
   * Update a post
   */
  async updatePost(
    request: FastifyRequest<{ Params: { id: string }, Body: UpdatePostBody }>,
    reply: FastifyReply
  ) {
    const { id } = request.params
    const updates = request.body
    
    try {
      const post = await this.prisma.post.update({
        where: { id },
        data: updates
      })
      return post
    } catch (error) {
      request.log.error(error)
      return reply.code(400).send({ error: 'Failed to update post' })
    }
  }

  /**
   * Delete a post
   */
  async deletePost(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
    userId: string
  ) {
    const { id } = request.params

    try {
      const post = await this.prisma.post.findUnique({ where: { id } })
      if (!post) return reply.code(404).send({ error: 'Post not found' })

      // Allow delete if user owns the post OR post was legacy/seeded
      const isLegacy = post.userId === 'legacy' || !post.userId
      if (!isLegacy && post.userId !== userId) {
        return reply.code(403).send({ error: 'Unauthorized: You can only delete your own posts' })
      }

      await this.prisma.post.delete({
        where: { id }
      })
      return { success: true }
    } catch (error) {
      request.log.error(error)
      return reply.code(400).send({ error: 'Failed to delete post' })
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(
    request: FastifyRequest<{ Params: { id: string }, Body: CommentBody }>,
    reply: FastifyReply,
    userId: string
  ) {
    const { id } = request.params
    const { user, avatar, text } = request.body
    
    if (!text || !text.trim()) {
      return reply.code(400).send({ error: 'Comment text is required' })
    }
    
    try {
      // Verify post exists
      const post = await this.prisma.post.findUnique({ where: { id } })
      if (!post) {
        return reply.code(404).send({ error: 'Post not found' })
      }

      const comment = await this.prisma.comment.create({
        data: {
          postId: id,
          userId,
          user,
          avatar,
          text: text.trim()
        }
      })
      
      return comment
    } catch (error: any) {
      request.log.error(error)
      return reply.code(400).send({ error: 'Failed to create comment', details: error.message })
    }
  }

  /**
   * Vote on a post
   */
  async votePost(
    request: FastifyRequest<{ Params: { id: string }, Body: VoteBody }>,
    reply: FastifyReply,
    userId: string
  ) {
    const { id } = request.params
    const { value } = request.body

    if (![1, -1].includes(value)) {
      return reply.code(400).send({ error: 'Invalid vote value' })
    }

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        // Check existing vote
        const existingVote = await prisma.postVote.findUnique({
          where: {
            postId_user: {
              postId: id,
              user: userId
            }
          }
        })

        let upvoteChange = 0
        let downvoteChange = 0

        if (existingVote) {
          if (existingVote.value === value) {
            // Toggle off (remove vote)
            await prisma.postVote.delete({
              where: { id: existingVote.id }
            })
            if (value === 1) upvoteChange = -1
            else downvoteChange = -1
          } else {
            // Change vote
            await prisma.postVote.update({
              where: { id: existingVote.id },
              data: { value }
            })
            if (value === 1) {
              upvoteChange = 1
              downvoteChange = -1
            } else {
              upvoteChange = -1
              downvoteChange = 1
            }
          }
        } else {
          // New vote
          await prisma.postVote.create({
            data: {
              postId: id,
              user: userId,
              value
            }
          })
          if (value === 1) upvoteChange = 1
          else downvoteChange = 1
        }

        // Update post counts
        const post = await prisma.post.update({
          where: { id },
          data: {
            upvotes: { increment: upvoteChange },
            downvotes: { increment: downvoteChange }
          }
        })

        return post
      })

      return result
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: 'Failed to vote' })
    }
  }
}

