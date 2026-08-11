import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma';

const router = Router();

// POST /api/auth/seed-admin — one-time admin creation
router.post('/seed-admin', async (_req, res: Response, next) => {
  try {
    const existing = await prisma.user.findUnique({ where: { email: 'admin@adyapan.com' } });
    if (existing) {
      res.json({ message: 'Admin already exists', email: 'admin@adyapan.com' });
      return;
    }

    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@adyapan.com',
        passwordHash,
        role: 'SUPER_ADMIN',
        isEmailVerified: true,
      },
    });

    res.status(201).json({ message: 'Admin created', email: 'admin@adyapan.com', password: 'Admin@123' });
  } catch (err) {
    next(err);
  }
});

export default router;
