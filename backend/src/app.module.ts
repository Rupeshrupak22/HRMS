import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationModule } from './organization/organization.module';
import { EmployeeModule } from './employee/employee.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeaveModule } from './leave/leave.module';
import { PayrollModule } from './payroll/payroll.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { PerformanceModule } from './performance/performance.module';
import { AssetModule } from './asset/asset.module';
import { DocumentModule } from './document/document.module';
import { ExpenseModule } from './expense/expense.module';
import { ExitModule } from './exit/exit.module';
import { AiModule } from './ai/ai.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OrganizationModule,
    EmployeeModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    RecruitmentModule,
    PerformanceModule,
    AssetModule,
    DocumentModule,
    ExpenseModule,
    ExitModule,
    AiModule,
    ReportsModule,
  ],
})
export class AppModule {}
