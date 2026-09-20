import { Request, Response, NextFunction } from 'express';

const MAX_BULK_RECORDS = 500;

/**
 * Middleware: Limit bulk import array size to prevent abuse.
 * Checks req.body.records (array) or req.body itself (if array).
 */
export function bulkLimit(req: Request, res: Response, next: NextFunction): void {
  const records = Array.isArray(req.body) ? req.body : (req.body?.records || req.body?.items);

  if (Array.isArray(records) && records.length > MAX_BULK_RECORDS) {
    res.status(400).json({
      success: false,
      message: `Maximum ${MAX_BULK_RECORDS} records per import. You sent ${records.length}.`,
    });
    return;
  }

  next();
}
