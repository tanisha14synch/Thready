/**
 * GET /posts – serve local posts so the app works without the Fastify backend.
 * Query: community=<id> to filter by community.
 */
// @ts-expect-error JSON import
import postsData from '../../app/data/posts.json'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const communityId = query.community as string | undefined
  let list = Array.isArray(postsData) ? postsData : []
  if (communityId && communityId.trim()) {
    list = list.filter(
      (p: { communityId?: string; community?: string }) =>
        p.communityId === communityId || p.community === communityId
    )
  }
  return list
})
