// Nuxt server route - exposes /auth/* and proxies to Fastify
// Required so Shopify OAuth callback /auth/shopify/callback is reachable on Vercel
import { server } from '../../src/server.js'

export default defineEventHandler(async (event) => {
  await server.ready()

  const requestURL = getRequestURL(event)
  const url = requestURL.pathname + requestURL.search || '/'
  const method = (event.node.req.method || 'GET') as string

  let body: any = undefined
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await readBody(event)
    } catch {
      // Body might not be JSON
    }
  }

  const query = getQuery(event)

  const response = (await server.inject({
    method: method as any,
    url,
    headers: event.node.req.headers as any,
    payload: body ? JSON.stringify(body) : undefined,
    query: query as any,
  })) as { statusCode: number; headers: Record<string, string | string[] | undefined>; payload: unknown }

  Object.entries(response.headers).forEach(([key, value]) => {
    if (value) {
      setHeader(event, key, Array.isArray(value) ? value.join(', ') : String(value))
    }
  })

  if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
    const location = response.headers.location
    return sendRedirect(event, Array.isArray(location) ? location[0] : location, response.statusCode)
  }

  setResponseStatus(event, response.statusCode)
  return response.payload
})
