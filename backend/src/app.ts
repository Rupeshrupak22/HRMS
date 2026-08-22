import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { env } from './lib/env';
import prisma from './lib/prisma';
import { errorHandler } from './middleware/errorHandler';
import { productionLogger } from './middleware/logger';
import { csrfProtection } from './middleware/csrf';
import { validateContentType } from './middleware/contentType';
import { securityGate, getSecurityStats } from './middleware/securityMonitor';

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
import syncRoutes from './routes/sync/sync.routes';
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
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      imgSrc: ["'none'"],
      connectSrc: ["'self'"],
      fontSrc: ["'none'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Permissions-Policy header
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  next();
});
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }
    // Wildcard only allowed in development — never in production
    if (allowedOrigins.includes('*')) {
      if (env.IS_PRODUCTION) {
        callback(new Error('CORS: wildcard origin not allowed in production'));
      } else {
        callback(null, true);
      }
      return;
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(cookieParser(env.COOKIE_SECRET));

// Content-Type validation for state-changing requests
app.use(validateContentType);

// Global rate limiting — robust in-memory store for high performance
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 1000 requests per 15 minutes per IP
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/api/health',
});
app.use(globalLimiter);

app.use(express.json({
  limit: '2mb',
  verify: (req: any, _res, buf) => {
    // Store raw body for webhook signature verification
    if (req.url && req.url.includes('/sync/employee')) {
      req.rawBody = buf.toString('utf8');
    }
  },
}));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Security monitoring — blocks IPs with excessive failed logins
app.use(securityGate);

// CSRF protection for state-changing requests
app.use(csrfProtection);

// Request logging — structured JSON in production, compact in development
app.use(productionLogger);

// Root & Health check endpoints for Render and uptime monitors
app.all(['/', '/health', '/api/health'], (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString(), environment: env.NODE_ENV });
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

// Teams endpoint (used by frontend employees page)
apiRouter.get('/teams', authenticate, async (_req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: { department: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: teams });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch teams' });
  }
});
apiRouter.use('/training', trainingRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/aravind', aravindRoutes);
apiRouter.use('/nitisha', nitishaRoutes);
apiRouter.use('/veena', veenaRoutes);
apiRouter.use('/veena-portal', veenaRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/sync', syncRoutes);

app.use('/api', apiRouter);
app.use('/api/v1', apiRouter);

// Pure Database handler for HR Manager Overall Reports
const getOverallReportsHandler = async (_req: express.Request, res: express.Response) => {
  try {
    const dbReports = await prisma.overallReport.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(dbReports || []);
  } catch (e: any) {
    console.error('getOverallReportsHandler DB error:', e?.message);
    return res.status(500).json({ error: 'Database query failed' });
  }
};

const postOverallReportHandler = async (req: express.Request, res: express.Response) => {
  try {
    const payload = {
      submittedBy: String(req.body.submittedBy || 'Nandini (HR Manager)'),
      reportDate: String(req.body.reportDate || new Date().toISOString().split('T')[0]),
      totalRecords: Number(req.body.totalRecords || 0),
      totalDailyReports: Number(req.body.totalDailyReports || 0),
      aravindSummary: req.body.aravindSummary ? String(req.body.aravindSummary) : null,
      nitishaSummary: req.body.nitishaSummary ? String(req.body.nitishaSummary) : null,
      veenaSummary: req.body.veenaSummary ? String(req.body.veenaSummary) : null,
      charithaSummary: req.body.charithaSummary ? String(req.body.charithaSummary) : null,
      pavitraSummary: req.body.pavitraSummary ? String(req.body.pavitraSummary) : null,
      remarks: req.body.remarks ? String(req.body.remarks) : null,
      status: String(req.body.status || 'SUBMITTED'),
    };
    const dbReport = await prisma.overallReport.create({ data: payload });
    return res.status(201).json(dbReport);
  } catch (err: any) {
    console.error('postOverallReportHandler DB error:', err?.message);
    return res.status(500).json({ error: err?.message || 'Database create failed' });
  }
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

app.get('/api/v1/payroll-public', getPayrollPublicHandler);
app.get('/api/payroll-public', getPayrollPublicHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
