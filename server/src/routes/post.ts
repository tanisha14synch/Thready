import type { FastifyInstance } from 'fastify'
import { PostController } from '../controllers/postController.js'
import { getUser } from '../utils/auth.js'

export default async function postRoutes(server: FastifyInstance) {
  const controller = new PostController(server.prisma)

  // Get all posts
  server.get<{ Querystring: { community?: string } }>('/posts', async (request, reply) => {
    return controller.getPosts(request, reply)
  })

  // Create a new post
  server.post<{ Body: any }>('/posts', async (request, reply) => {
    const userId = getUser(request)
    return controller.createPost(request, reply, userId)
  })

  // Update a post
  server.put<{ Params: { id: string }, Body: any }>('/posts/:id', async (request, reply) => {
    return controller.updatePost(request, reply)
  })

  // Delete a post
  server.delete<{ Params: { id: string } }>('/posts/:id', async (request, reply) => {
    const userId = getUser(request)
    return controller.deletePost(request, reply, userId)
  })

  // Add a comment to a post
  server.post<{ Params: { id: string }, Body: any }>('/posts/:id/comments', async (request, reply) => {
    const userId = getUser(request)
    return controller.addComment(request, reply, userId)
  })

  // Vote on a post
  server.post<{ Params: { id: string }, Body: { value: number } }>('/posts/:id/vote', async (request, reply) => {
    const userId = getUser(request)
    return controller.votePost(request, reply, userId)
  })
}
