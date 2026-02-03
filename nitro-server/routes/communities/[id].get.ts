/**
 * GET /communities/:id – single community for store fetchCommunityById.
 */
// @ts-expect-error JSON import
import communityData from '../../../app/data/communities.json'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const list = Array.isArray(communityData) ? communityData : []
  const community = list.find((c: { id: string }) => c.id === id)
  if (!community) {
    throw createError({ statusCode: 404, statusMessage: 'Community not found' })
  }
  return community
})
