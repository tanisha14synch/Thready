import type { FastifyInstance } from 'fastify'
import { PostController } from '../controllers/postController.js'
import { requireJwt } from '../utils/jwt.js'

export default async function postRoutes(server: FastifyInstance) {
  const controller = new PostController(server.prisma)

  // Get all posts (public, but uses authenticated user for vote data)
  server.get<{ Querystring: { community?: string } }>('/posts', { preHandler: requireJwt }, async (request, reply) => {
    return controller.getPosts(request, reply)
  })

  // Create a new post (requires authentication)
  server.post<{ Body: any }>('/posts', { preHandler: requireJwt }, async (request, reply) => {
    return controller.createPost(request, reply)
  })

  // Update a post (requires authentication and ownership)
  server.put<{ Params: { id: string }, Body: any }>('/posts/:id', { preHandler: requireJwt }, async (request, reply) => {
    return controller.updatePost(request, reply)
  })

  // Delete a post (requires authentication and ownership)
  server.delete<{ Params: { id: string } }>('/posts/:id', { preHandler: requireJwt }, async (request, reply) => {
    return controller.deletePost(request, reply)
  })

  // Add a comment to a post (requires authentication)
  server.post<{ Params: { id: string }, Body: any }>('/posts/:id/comments', { preHandler: requireJwt }, async (request, reply) => {
    return controller.addComment(request, reply)
  })

  // Vote on a post (requires authentication)
  server.post<{ Params: { id: string }, Body: { value: number } }>('/posts/:id/vote', { preHandler: requireJwt }, async (request, reply) => {
    return controller.votePost(request, reply)
  })
}
