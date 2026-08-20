import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'change-me-cookie-secret',
  IS_PRODUCTION: (process.env.NODE_ENV || 'development') === 'production',

  // CRM Sync Configuration
  CRM_BACKEND_URL: process.env.CRM_BACKEND_URL || '',
  CRM_SYNC_API_KEY: process.env.CRM_SYNC_API_KEY || '',
  CRM_WEBHOOK_SECRET: process.env.CRM_WEBHOOK_SECRET || '',
};
