import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

// Allowed file extensions for document uploads
const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.txt', '.csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const uploadSchema = z.object({
  employeeId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
  fileUrl: z.string().min(1).max(2048).refine((url) => {
    // Must be a valid URL or relative path
    try {
      if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')) {
        // Validate file extension
        const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
        return ext ? ALLOWED_FILE_EXTENSIONS.includes(`.${ext}`) : false;
      }
      return false;
    } catch {
      return false;
    }
  }, { message: 'Invalid file URL or unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, TXT, CSV' }),
  fileSize: z.number().max(MAX_FILE_SIZE, 'File size exceeds 10MB limit').optional(),
});

// GET /api/documents
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const where: any = {};
    if (req.user!.role === 'EMPLOYEE') {
      where.employeeId = req.user!.employeeId;
    } else if (req.query.employeeId) {
      where.employeeId = req.query.employeeId;
    }
    if (req.query.category) where.category = req.query.category;

    const docs = await prisma.employeeDocument.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
});

// POST /api/documents
router.post('/', validate(uploadSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const doc = await prisma.employeeDocument.create({
      data: {
        ...req.body,
        employeeId: req.body.employeeId || req.user!.employeeId!,
      },
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/documents/:id/verify
router.patch('/:id/verify', authorize('HR_ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response, next) => {
  try {
    const doc = await prisma.employeeDocument.update({
      where: { id: String(req.params.id) },
      data: { isVerified: true },
    });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    // Employees can only delete their own documents
    const doc = await prisma.employeeDocument.findUnique({ where: { id: String(req.params.id) } });
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    if (req.user!.role === 'EMPLOYEE' && doc.employeeId !== req.user!.employeeId) {
      res.status(403).json({ success: false, message: 'You can only delete your own documents' });
      return;
    }
    await prisma.employeeDocument.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, data: { message: 'Document deleted' } });
  } catch (err) {
    next(err);
  }
});

export default router;
