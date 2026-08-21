import { Router, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

// GET /api/notifications
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: AuthRequest, res: Response, next) => {
  try {
    // BOLA: verify notification belongs to the requesting user
    const notification = await prisma.notification.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!notification || notification.userId !== req.user!.id) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    const updated = await prisma.notification.update({
      where: { id: String(req.params.id) },
      data: { isRead: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req: AuthRequest, res: Response, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
});

export default router;
