import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // 检查DATABASE_URL是否存在
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. Using default configuration.');
  }

  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ipam_activation_generator',
      },
    },
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma 