 export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export interface AuthErrorOptions {
  code?: string;
  remainingAttempts?: number;
  lockoutMinutes?: number;
  forceLogout?: boolean;
}

export class AuthError extends AppError {
  public readonly code?: string;
  public readonly remainingAttempts?: number;
  public readonly lockoutMinutes?: number;
  public readonly forceLogout?: boolean;

  constructor(message: string, statusCode = 401, options: AuthErrorOptions = {}) {
    super(message, statusCode);
    this.code = options.code;
    this.remainingAttempts = options.remainingAttempts;
    this.lockoutMinutes = options.lockoutMinutes;
    this.forceLogout = options.forceLogout;
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503);
  }
}
