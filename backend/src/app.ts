import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { env } from './lib/env';
import prisma from './lib/prisma';
import { errorHandler } from './middleware/errorHandler';
import { csrfProtection } from './middleware/csrf';

// Route imports
import authRoutes from './routes/auth/auth.routes';
import adminSeedRoutes from './routes/auth/admin-seed.routes';
import employeeRoutes from './routes/employees/employee.routes';
import departmentRoutes from './routes/departments/department.routes';
import attendanceRoutes from './routes/attendance/attendance.routes';
import leaveRoutes from './routes/leave/leave.routes';
import payrollRoutes from './routes/payroll/payroll.routes';
import recruitmentRoutes from './routes/recruitment/recruitment.routes';
import performanceRoutes from './routes/performance/performance.routes';
import documentRoutes from './routes/documents/document.routes';
import expenseRoutes from './routes/expenses/expense.routes';
import exitRoutes from './routes/exit/exit.routes';
import assetRoutes from './routes/assets/asset.routes';
import organizationRoutes from './routes/organization/organization.routes';
import trainingRoutes from './routes/training/training.routes';
import reportRoutes from './routes/reports/report.routes';
import notificationRoutes from './routes/notifications/notification.routes';
import aravindRoutes from './routes/specialists/aravind.routes';
import nitishaRoutes from './routes/specialists/nitisha.routes';
import veenaRoutes from './routes/specialists/veena.routes';
import aiRoutes from './routes/ai/ai.routes';
import { authenticate } from './middleware/auth';

const app = express();

// Trust proxy (required for Render, Vercel, etc.)
app.set('trust proxy', 1);

// Global middleware
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: false, // Disable CSP for API server — frontend handles its own
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production for now — tighten later
    }
  },
  credentials: true,
}));
app.use(cookieParser(env.COOKIE_SECRET));

// Global rate limiting: high throughput for enterprise HRMS operations
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // 5000 requests per 15 minutes to comfortably support dashboards & specialists
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/api/health',
});
app.use(globalLimiter);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// CSRF protection for state-changing requests
app.use(csrfProtection);

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: env.NODE_ENV });
});

// API Routes — mounted at both /api and /api/v1 for frontend compatibility
const apiRouter = Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/auth', adminSeedRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/leave', leaveRoutes);
apiRouter.use('/payroll', payrollRoutes);
apiRouter.use('/recruitment', recruitmentRoutes);
apiRouter.use('/performance', performanceRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/exit', exitRoutes);
apiRouter.use('/assets', assetRoutes);
apiRouter.use('/organization', organizationRoutes);
apiRouter.use('/training', trainingRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/aravind', aravindRoutes);
apiRouter.use('/nitisha', nitishaRoutes);
apiRouter.use('/veena', veenaRoutes);
apiRouter.use('/veena-portal', veenaRoutes);
apiRouter.use('/ai', aiRoutes);

app.use('/api', apiRouter);
app.use('/api/v1', apiRouter);

// Disk & Memory persistent store for HR Manager Overall Reports
const reportsFilePath = path.join(__dirname, '../data/overall_reports.json');

const loadDiskReports = (): any[] => {
  try {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(reportsFilePath)) {
      const fileData = fs.readFileSync(reportsFilePath, 'utf-8');
      const parsed = JSON.parse(fileData);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  return [];
};

const saveDiskReports = (reports: any[]) => {
  try {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(reportsFilePath, JSON.stringify(reports, null, 2), 'utf-8');
  } catch {}
};

const getOverallReportsHandler = async (_req: express.Request, res: express.Response) => {
  try {
    let dbReports: any[] = [];
    if ((prisma as any).overallReport) {
      dbReports = await (prisma as any).overallReport.findMany({ orderBy: { createdAt: 'desc' } });
    }
    const combined = [...dbReports];
    const diskReports = loadDiskReports();
    for (const mem of diskReports) {
      if (!combined.some(r => r.id === mem.id || (r.reportDate === mem.reportDate && r.submittedBy === mem.submittedBy))) {
        combined.push(mem);
      }
    }
    res.json(combined);
  } catch {
    res.json(loadDiskReports());
  }
};

const postOverallReportHandler = async (req: express.Request, res: express.Response) => {
  // Validate incoming report data
  const allowedFields = ['reportDate', 'submittedBy', 'department', 'summary', 'metrics', 'status', 'notes'];
  const sanitizedBody: Record<string, any> = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      sanitizedBody[key] = req.body[key];
    }
  }

  const newReport: Record<string, any> = {
    id: `ov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    status: 'SUBMITTED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...sanitizedBody,
  };
  const currentDisk = loadDiskReports();
  const updatedDisk = [newReport, ...currentDisk.filter((r: any) => r.id !== newReport.id && r.reportDate !== newReport.reportDate)];
  saveDiskReports(updatedDisk);

  try {
    if ((prisma as any).overallReport) {
      const dbReport = await (prisma as any).overallReport.create({ data: sanitizedBody });
      return res.status(201).json(dbReport);
    }
  } catch (err: any) {
    console.warn('Prisma OverallReport insert fallback to disk store:', err?.message);
  }
  return res.status(201).json(newReport);
};

// GET & POST /api/v1/overall-report — HR Manager report data (protected)
app.get('/api/v1/overall-report', authenticate, getOverallReportsHandler);
app.get('/api/overall-report', authenticate, getOverallReportsHandler);
app.post('/api/v1/overall-report', authenticate, postOverallReportHandler);
app.post('/api/overall-report', authenticate, postOverallReportHandler);

const getPayrollPublicHandler = async (_req: express.Request, res: express.Response) => {
  try {
    const records = await prisma.manualPayrollRecord.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(records || []);
  } catch {
    return res.json([]);
  }
};

app.get('/api/v1/payroll-public', authenticate, getPayrollPublicHandler);
app.get('/api/payroll-public', authenticate, getPayrollPublicHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
