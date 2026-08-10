import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExitService } from './exit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName, ExitStatus } from '@prisma/client';

@ApiTags('Exit & F&F Settlement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exit')
export class ExitController {
  constructor(private exitService: ExitService) {}

  @Post('resignation')
  async submitResignation(@Request() req: any, @Body() body: { lastWorkingDay: string; reason: string }) {
    return this.exitService.submitResignation(req.user.employeeId, body);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.FINANCE, RoleName.DEPARTMENT_HEAD)
  @Get('resignations')
  async getAllResignations() {
    return this.exitService.getAllResignations();
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.FINANCE, RoleName.DEPARTMENT_HEAD)
  @Put('resignations/:id/status')
  async updateResignationStatus(
    @Param('id') id: string,
    @Body() body: { status: ExitStatus; managerApproval?: boolean; hrApproval?: boolean },
  ) {
    return this.exitService.updateResignationStatus(id, body.status, body.managerApproval, body.hrApproval);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.FINANCE)
  @Post('fnf/:employeeId/calculate')
  async calculateFnF(@Param('employeeId') employeeId: string) {
    return this.exitService.calculateFnF(employeeId);
  }
}
