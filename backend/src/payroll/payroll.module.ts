import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController, ManualPayrollController } from './payroll.controller';

@Module({
  controllers: [PayrollController, ManualPayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
