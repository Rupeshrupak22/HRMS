import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Handle disconnection gracefully - Prisma will auto-reconnect on next query
prisma.$connect().catch(() => {
  console.warn('⚠️ Initial DB connection failed - will retry on first query');
});

export default prisma;
