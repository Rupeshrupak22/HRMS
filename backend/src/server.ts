import app from './app';
import { env } from './lib/env';
import prisma from './lib/prisma';

async function main() {
  // Verify database connection (retry up to 3 times)
  let connected = false;
  for (let i = 0; i < 3; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      connected = true;
      break;
    } catch (err) {
      console.warn(`⚠️ Database connection attempt ${i + 1} failed, retrying...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  if (!connected) {
    console.warn('⚠️ Could not connect to database on startup. Server will start anyway and retry on first request.');
  }

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`📋 Environment: ${env.NODE_ENV}`);
  });

  // Keep database warm - ping every 4 minutes to prevent cold starts
  setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {}
  }, 4 * 60 * 1000);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
