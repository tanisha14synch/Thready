import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import prismaPlugin from './plugins/prisma.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import communityRoutes from './routes/community.js'
import postRoutes from './routes/post.js'
import commentRoutes from './routes/comment.js'

const server = Fastify({
  logger: true,
  trustProxy: true // Required if behind reverse proxy
})

// Cookie support for session management
server.register(cookie, {
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your-session-secret-change-in-production',
  parseOptions: {}
})

server.register(cors, { 
  origin: true,
  credentials: true // Allow cookies in CORS
})

server.register(prismaPlugin)
server.register(authRoutes)
server.register(userRoutes)
server.register(communityRoutes)
server.register(postRoutes)
server.register(commentRoutes)

server.get('/', async (request, reply) => {
  return { hello: 'world' }
})

const start = async () => {
  try {
    const port = Number(process.env.PORT || 3001)
    await server.listen({ port, host: '0.0.0.0' })
    console.log(`Server listening on http://localhost:${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
