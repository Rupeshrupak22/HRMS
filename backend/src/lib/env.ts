import dotenv from 'dotenv';
dotenv.config();

const INSECURE_DEFAULTS = ['change-me', 'change-me-refresh', 'change-me-cookie-secret'];

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'change-me-cookie-secret',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  IS_PRODUCTION: (process.env.NODE_ENV || 'development') === 'production',

  // CRM Sync Configuration
  CRM_BACKEND_URL: process.env.CRM_BACKEND_URL || '',
  CRM_SYNC_API_KEY: process.env.CRM_SYNC_API_KEY || '',
  CRM_WEBHOOK_SECRET: process.env.CRM_WEBHOOK_SECRET || '',
};

/**
 * Validate that critical secrets are set in production.
 * Crashes the process immediately if insecure defaults are detected.
 */
export function validateSecrets(): void {
  const isProduction = env.IS_PRODUCTION;
  const errors: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  if (!process.env.JWT_SECRET || INSECURE_DEFAULTS.includes(process.env.JWT_SECRET)) {
    if (isProduction) errors.push('JWT_SECRET must be set to a secure random value in production');
    else console.warn('⚠️  JWT_SECRET is using insecure default — acceptable in development only');
  }

  if (!process.env.JWT_REFRESH_SECRET || INSECURE_DEFAULTS.includes(process.env.JWT_REFRESH_SECRET)) {
    if (isProduction) errors.push('JWT_REFRESH_SECRET must be set to a secure random value in production');
    else console.warn('⚠️  JWT_REFRESH_SECRET is using insecure default — acceptable in development only');
  }

  if (!process.env.COOKIE_SECRET || INSECURE_DEFAULTS.includes(process.env.COOKIE_SECRET)) {
    if (isProduction) errors.push('COOKIE_SECRET must be set to a secure random value in production');
    else console.warn('⚠️  COOKIE_SECRET is using insecure default — acceptable in development only');
  }

  if (isProduction && (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*')) {
    errors.push('CORS_ORIGIN must be explicitly set in production (no wildcard)');
  }

  if (errors.length > 0) {
    console.error('❌ FATAL: Security configuration errors detected:');
    errors.forEach((e) => console.error(`   • ${e}`));
    console.error('   Server cannot start with insecure configuration in production.');
    process.exit(1);
  }
}
