# HMRS Backend

Express 5 + TypeScript + Prisma ORM + Supabase PostgreSQL

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 5
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Zod

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database
npm run prisma:seed

# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

## Project Structure

```
src/
├── app.ts              # Express app setup & middleware
├── server.ts           # Server entry point
├── lib/
│   ├── env.ts          # Environment configuration
│   ├── errors.ts       # Custom error classes
│   └── prisma.ts       # Prisma client instance
├── middleware/
│   ├── auth.ts         # JWT authentication & role authorization
│   ├── errorHandler.ts # Global error handler
│   └── validate.ts     # Zod validation middleware
├── routes/
│   ├── auth/           # Login, refresh, logout
│   ├── employees/      # Employee CRUD
│   ├── departments/    # Department management
│   ├── attendance/     # Check-in/out, records
│   ├── leave/          # Leave types, balances, requests
│   ├── payroll/        # Cycles, processing, payslips
│   ├── recruitment/    # Jobs, candidates
│   ├── performance/    # Goals, reviews
│   ├── documents/      # Employee documents
│   ├── expenses/       # Expense claims
│   ├── exit/           # Resignations, FnF
│   ├── assets/         # Asset tracking
│   ├── organization/   # Settings, designations, teams
│   ├── training/       # Courses, enrollments
│   ├── reports/        # Daily reports, audit logs
│   └── notifications/  # User notifications
├── seeds/
│   └── index.ts        # Database seed script
└── types/
    └── index.ts        # Shared TypeScript types
```

## API Endpoints

All API routes are prefixed with `/api`.

| Module         | Endpoints                            |
|----------------|--------------------------------------|
| Auth           | POST /auth/login, /auth/refresh, /auth/logout, GET /auth/me |
| Employees      | GET/POST /employees, GET/PATCH/DELETE /employees/:id |
| Departments    | GET/POST /departments, GET/PATCH/DELETE /departments/:id |
| Attendance     | GET /attendance, POST /attendance/check-in, /check-out, /mark |
| Leave          | GET /leave/types, /balances, /requests, POST /leave/apply |
| Payroll        | GET/POST /payroll/cycles, POST /payroll/process |
| Recruitment    | GET/POST /recruitment/jobs, /candidates |
| Performance    | GET/POST /performance/goals, /reviews |
| Documents      | GET/POST /documents, PATCH /documents/:id/verify |
| Expenses       | GET/POST /expenses, PATCH /expenses/:id/status |
| Exit           | POST /exit/resign, /exit/fnf, GET /exit/resignations |
| Assets         | GET/POST /assets, POST /assets/assign, /assets/return/:id |
| Organization   | GET/PATCH /organization/settings, GET/POST /organization/designations, /teams |
| Training       | GET/POST /training/courses, POST /training/enroll |
| Reports        | GET/POST /reports/daily, GET /reports/audit-logs |
| Notifications  | GET /notifications, PATCH /notifications/:id/read |

## Default Users (after seeding)

| Email              | Password   | Role        |
|--------------------|------------|-------------|
| admin@adyapan.com  | Admin@123  | SUPER_ADMIN |
| hr@adyapan.com     | Hr@12345   | HR_ADMIN    |

## Environment Variables

```
DATABASE_URL=        # Supabase PostgreSQL connection string
PORT=4000            # Server port
JWT_SECRET=          # Access token secret
JWT_REFRESH_SECRET=  # Refresh token secret
JWT_EXPIRES_IN=8h    # Access token expiry
JWT_REFRESH_EXPIRES_IN=7d  # Refresh token expiry
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```
