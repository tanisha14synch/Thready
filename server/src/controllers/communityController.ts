import type { PrismaClient } from '@prisma/client'
import type { FastifyRequest, FastifyReply } from 'fastify'
// @ts-ignore - slugify has incorrect type definitions
import slugify from 'slugify'

interface CommunityBody {
  id: string
  name: string
  description?: string
  headerImage?: string
  icon?: string
  isPublic?: boolean
  tags?: string[]
  moderators?: { username: string; avatar?: string }[]
}

export class CommunityController {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all communities
   */
  async getCommunities(request: FastifyRequest, reply: FastifyReply) {
    try {
      const communities = await this.prisma.community.findMany({
        include: {
          moderators: true,
        }
      })
      return communities.map((c: any) => ({
        ...c,
        tags: c.tags ? JSON.parse(c.tags) : []
      }))
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: 'Failed to fetch communities' })
    }
  }

  /**
   * Get a specific community by ID
   */
  async getCommunityById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params
    
    try {
      const community = await this.prisma.community.findUnique({
        where: { id },
        include: {
          moderators: true,
          posts: {
            include: {
              comments: true
            },
            orderBy: {
              postedAt: 'desc'
            }
          }
        }
      })
      
      if (!community) {
        return reply.code(404).send({ error: 'Community not found' })
      }

      return {
        ...community,
        tags: community.tags ? JSON.parse(community.tags) : [],
        posts: community.posts.map((p: any) => ({
          ...p,
          comments: p.comments.length,
          commentsList: p.comments
        }))
      }
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: 'Failed to fetch community' })
    }
  }

  /**
   * Create a new community
   */
  async createCommunity(
    request: FastifyRequest<{ Body: CommunityBody }>,
    reply: FastifyReply
  ) {
    const { id, name, description, headerImage, icon, isPublic, tags, moderators } = request.body

    if (!name) {
      return reply.code(400).send({ error: 'Name is required' })
    }

    // Generate a slugged id if not provided
    const communityId = id && id.trim().length > 0
      ? id
      : (slugify as any)(name, { lower: true, strict: true })

    try {
      // Ensure uniqueness
      const existing = await this.prisma.community.findUnique({ where: { id: communityId } })
      if (existing) {
        return reply.code(409).send({ error: 'Community already exists with this id' })
      }

      const community = await this.prisma.community.create({
        data: {
          id: communityId, 
          name,
          description,
          headerImage,
          icon,
          isPublic,
          tags: JSON.stringify(tags || []),
          moderators: {
            create: moderators ? moderators.map((m: any) => ({
              username: m.username,
              avatar: m.avatar
            })) : []
          }
        }
      })
      return community
    } catch (error: any) {
      request.log.error(error)
      return reply.code(400).send({ error: 'Failed to create community', details: error.message })
    }
  }
}

