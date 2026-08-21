import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // If using Supabase pooler, auto route to port 6543 (Transaction Pooler) with pgbouncer and safe connection limits
  if (url.includes('pooler.supabase.com')) {
    url = url.replace(':5432/', ':6543/');
    if (!url.includes('pgbouncer=true')) {
      url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
    if (!url.includes('connection_limit=')) {
      url += '&connection_limit=5&pool_timeout=20';
    }
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

globalForPrisma.prisma = prisma;

export default prisma;
