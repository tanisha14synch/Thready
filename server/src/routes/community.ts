import type { FastifyInstance } from 'fastify'
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

export default async function communityRoutes(server: FastifyInstance) {
  server.get('/communities', async (request, reply) => {
    const communities = await server.prisma.community.findMany({
      include: {
        moderators: true,
      }
    })
    return communities.map((c: any) => ({
      ...c,
      tags: c.tags ? JSON.parse(c.tags) : []
    }))
  })

  server.get<{ Params: { id: string } }>('/communities/:id', async (request, reply) => {
    const { id } = request.params
    const community = await server.prisma.community.findUnique({
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
  })

  server.post<{ Body: CommunityBody }>('/communities', async (request, reply) => {
    const { id, name, description, headerImage, icon, isPublic, tags, moderators } = request.body

    if (!name) {
      return reply.code(400).send({ error: 'Name is required' })
    }

    // Generate a slugged id if not provided
    const communityId = id && id.trim().length > 0
      ? id
      : slugify(name, { lower: true, strict: true })

    try {
      // Ensure uniqueness
      const existing = await server.prisma.community.findUnique({ where: { id: communityId } })
      if (existing) {
        return reply.code(409).send({ error: 'Community already exists with this id' })
      }

      const community = await server.prisma.community.create({
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
    } catch (e: any) {
      server.log.error(e)
      return reply.code(400).send({ error: 'Failed to create community', details: e.message })
    }
  })
}
