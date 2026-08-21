import { Request, Response, NextFunction } from 'express';

/**
 * Content-Type validation middleware.
 * Rejects POST/PUT/PATCH requests that don't have a valid Content-Type header.
 * Prevents attackers from sending malformed payloads that bypass body parsers.
 */
export function validateContentType(req: Request, res: Response, next: NextFunction): void {
  // Only validate methods that should have a body
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    next();
    return;
  }

  // Skip if body is empty (content-length 0 or no content-length)
  const contentLength = req.headers['content-length'];
  if (contentLength === '0') {
    next();
    return;
  }

  const contentType = req.headers['content-type'] || '';
  const allowedTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
  ];

  const isValid = allowedTypes.some((type) => contentType.includes(type));

  if (!isValid && contentLength && parseInt(contentLength, 10) > 0) {
    res.status(415).json({
      success: false,
      message: 'Unsupported Media Type. Expected application/json, application/x-www-form-urlencoded, or multipart/form-data.',
    });
    return;
  }

  next();
}
