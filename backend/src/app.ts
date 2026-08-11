import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './lib/env';
import { errorHandler } from './middleware/errorHandler';

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

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

app.use('/api', apiRouter);
app.use('/api/v1', apiRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
