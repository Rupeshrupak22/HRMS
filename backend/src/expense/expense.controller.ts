import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName, ExpenseStatus } from '@prisma/client';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  @Get('my-claims')
  async getMyClaims(@Request() req: any) {
    return this.expenseService.getMyClaims(req.user.employeeId);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.FINANCE, RoleName.DEPARTMENT_HEAD)
  @Get('all')
  async getAllClaims() {
    return this.expenseService.getAllClaims();
  }

  @Post('apply')
  async createClaim(
    @Request() req: any,
    @Body() body: { title: string; category: string; amount: number; expenseDate: string; receiptUrl?: string },
  ) {
    return this.expenseService.createClaim(req.user.employeeId, body);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.FINANCE, RoleName.DEPARTMENT_HEAD)
  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: ExpenseStatus }) {
    return this.expenseService.updateStatus(id, body.status);
  }
}
