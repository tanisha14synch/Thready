import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

let prisma: PrismaClient

declare global {
  // Reuse PrismaClient in dev mode (hot reload safe)
  var __prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

if (process.env.NODE_ENV === 'production') {
  const adapter = new PrismaPg({ connectionString })
  prisma = new PrismaClient({ adapter })
} else {
  if (!global.__prisma) {
    const adapter = new PrismaPg({ connectionString })
    global.__prisma = new PrismaClient({ adapter })
  }
  prisma = global.__prisma
}

export default prisma
