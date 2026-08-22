import { vi } from 'vitest';

// Mock Prisma client for unit tests
vi.mock('../src/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    employee: { findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    notification: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    goal: { findMany: vi.fn() },
    fnFSettlement: { findUnique: vi.fn() },
    $queryRaw: vi.fn(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));
