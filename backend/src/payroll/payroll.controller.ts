import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName, PayrollStatus } from '@prisma/client';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.FINANCE)
  @Get('salary-structures')
  async getSalaryStructures() {
    return this.payrollService.getSalaryStructures();
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.FINANCE)
  @Get('cycles')
  async getCycles() {
    return this.payrollService.getCycles();
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.FINANCE)
  @Get('cycles/:id')
  async getCycleById(@Param('id') id: string) {
    return this.payrollService.getCycleById(id);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.FINANCE)
  @Post('cycles/generate')
  async generateCycle(@Body() body: { month: number; year: number }) {
    return this.payrollService.generateCycle(body.month, body.year);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.FINANCE)
  @Put('cycles/:id/status')
  async updateCycleStatus(@Param('id') id: string, @Body() body: { status: PayrollStatus }) {
    return this.payrollService.updateCycleStatus(id, body.status);
  }

  @Get('my-payslips')
  async getMyPayslips(@Request() req: any) {
    return this.payrollService.getMyPayslips(req.user.employeeId);
  }
}
