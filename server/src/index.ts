import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import prismaPlugin from './plugins/prisma.js'
import communityRoutes from './routes/community.js'
import postRoutes from './routes/post.js'
import commentRoutes from './routes/comment.js'
import authRoutes from './routes/auth.js'

const server = Fastify({
  logger: true
})

server.register(cors, {
  origin: process.env.FRONTEND_URL || true,
  credentials: true
})

server.register(prismaPlugin)
server.register(authRoutes)
server.register(communityRoutes)
server.register(postRoutes)
server.register(commentRoutes)

server.get('/', async (request, reply) => {
  return { hello: 'world' }
})

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' })
    console.log(`Server listening on http://localhost:3000`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
