// Nuxt server API route - handles all backend routes
// This proxies requests to the Fastify server
// Note: This file is in server/api/ which Nuxt will treat as server API routes
import { server } from '../src/server.js'

export default defineEventHandler(async (event) => {
  await server.ready()
  
  const url = event.node.req.url || '/'
  const method = event.node.req.method || 'GET'
  
  // Get request body if present
  let body: any = undefined
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await readBody(event)
    } catch {
      // Body might not be JSON
    }
  }
  
  // Get query params
  const query = getQuery(event)
  
  // Handle request with Fastify
  const response = await server.inject({
    method,
    url,
    headers: event.node.req.headers as any,
    payload: body ? JSON.stringify(body) : undefined,
    query: query as any,
  })
  
  // Set response headers
  Object.entries(response.headers).forEach(([key, value]) => {
    if (value) {
      setHeader(event, key, Array.isArray(value) ? value.join(', ') : String(value))
    }
  })
  
  // Handle redirects
  if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
    return sendRedirect(event, response.headers.location, response.statusCode)
  }
  
  // Return response
  setResponseStatus(event, response.statusCode)
  return response.payload
})
