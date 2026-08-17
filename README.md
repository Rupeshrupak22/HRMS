# Adyapan HRMS — Production-Ready Enterprise HR Management System

Built for **Adyapan Edutech Pvt. Ltd.**

Adyapan HRMS is a modern, secure, and scalable Human Resource Management System. It manages the complete end-to-end employee lifecycle:

Recruitment → Hiring → Onboarding → Employee Management → Attendance → Leave → Payroll → Performance → Assets → Training → Documents → Exit → Full & Final Settlement

---

## Tech Stack & Architecture

### Backend (`/backend`)
* **Framework**: NestJS (TypeScript, REST API, DTO Validation, Global Exception Filter)
* **Database**: PostgreSQL / SQLite zero-config dev setup with Prisma 7 ORM
* **Authentication**: JWT + Refresh Token Rotation + Password Hashing (Bcrypt) + RBAC Guards
* **AI Engine**: Google Gemini 2.5 SDK (`@google/genai`) for ATS Resume Match Scoring & HR AI Copilot
* **Storage**: AWS S3 Presigned URL Architecture (`@aws-sdk/client-s3`)
* **API Documentation**: Swagger / OpenAPI live at `http://localhost:4000/api/docs`

### Frontend (`/frontend`)
* **Framework**: Next.js 14+ (App Router), TypeScript, React 18
* **Styling**: Tailwind CSS + Custom Adyapan Edutech visual theme (Deep slate `#0F172A`, Electric Blue `#2563EB`, Violet `#7C3AED`, Glassmorphism)
* **Icons & Charts**: Lucide Icons & Recharts (Area, Bar, Pie charts)
* **State & Forms**: React Hook Form, Zod validation, Auth Context with instant 7-Role Switcher
* **Document Export**: Client-side & server-side PDF payslip & offer letter generation (`jspdf`)

---

## Getting Started

### 1. Backend Setup & Database Seeding

```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm run start:dev
```

* Backend API: `http://localhost:4000/api/v1`
* Swagger Docs: `http://localhost:4000/api/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

* Frontend Web App: `http://localhost:3000`

---

## Role-Based Access Control (RBAC) Accounts

Default Seed Users (`Password123!` for all):

| Role | Email | Features & Scope |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@adyapan.com` | Full system access, audit logs, admin settings |
| **HR Admin** | `hradmin@adyapan.com` | Employee CRUD, Attendance, Leave approvals, Recruitment, Payroll |
| **HR Executive** | `hrexecutive@adyapan.com` | Candidate screening, document verifications, onboarding |
| **Finance** | `finance@adyapan.com` | Payroll cycle calculations, expense reimbursements, F&F settlements |
| **Department Head**| `techlead@adyapan.com` | Tech department approvals, performance reviews |
| **Team Leader** | `teamlead@adyapan.com` | Team attendance & leave approvals |
| **Employee** | `employee@adyapan.com` | Self-Service Portal (Check-in/out, payslips, leave applications) |

---

## Key Modules Included

1. **HR AI Copilot**: Context-aware natural language assistant with RBAC safeguards ("Who is absent today?", "Show total tech payroll").
2. **ATS & AI Resume Matcher**: Candidate pipeline with automated Gemini match scoring %.
3. **Attendance & Shift Rules**: Web check-in/check-out with live clock, late arrival grace period calculation, and logs sheet.
4. **Leave Management & Holiday Calendar**: Encashable/non-encashable balances, multi-stage approval queue, and holiday list.
5. **Payroll & Payslip PDF**: Automated monthly CTC calculation, salary register, and downloadable PDF payslips.
6. **12-Tab Employee Profile**: Comprehensive view covering personal, employment, salary, documents, assets, performance, and activity.
7. **Document Vault**: AWS S3 presigned URL uploads.
8. **Exit & F&F Settlement**: Resignations, department clearances, and automated F&F statement calculator.
