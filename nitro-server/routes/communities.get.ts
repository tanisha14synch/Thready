/**
 * GET /communities – serve local communities so the app works without the Fastify backend.
 * When NUXT_PUBLIC_API_BASE is unset, the frontend uses same-origin and hits this route.
 */
// @ts-expect-error JSON import
import communityData from '../../app/data/communities.json'

export default defineEventHandler(() => {
  const list = Array.isArray(communityData) ? communityData : []
  return list
})
