import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createEmployeeSchema, updateEmployeeSchema } from './employee.schema';
import * as employeeService from './employee.service';
import { AuthRequest } from '../../types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/employees
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { search, departmentId, status } = req.query as any;
    const employees = await employeeService.findAll({
      search,
      departmentId,
      status,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      specialization: req.user!.specialization || undefined,
    });
    res.json({ success: true, data: employees, count: employees.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/employees/:id
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const employee = await employeeService.findOne(String(req.params.id));
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
});

// POST /api/employees
router.post('/', authorize('HR_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'), validate(createEmployeeSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const employee = await employeeService.create(req.body, req.user!.email);
    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/employees/:id
router.patch('/:id', authorize('HR_ADMIN', 'HR_MANAGER', 'MANAGER'), validate(updateEmployeeSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const employee = await employeeService.update(String(req.params.id), req.body);
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/employees/:id
router.delete('/:id', authorize('HR_ADMIN'), async (req: AuthRequest, res: Response, next) => {
  try {
    const result = await employeeService.remove(String(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
