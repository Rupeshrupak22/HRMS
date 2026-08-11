import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '../prisma/enums';

@ApiTags('Leaves')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leaves')
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Get('types')
  async getTypes() {
    return this.leaveService.getTypes();
  }

  @Get('my-balances')
  async getMyBalances(@Request() req: any) {
    return this.leaveService.getMyBalances(req.user.employeeId);
  }

  @Post('apply')
  async apply(@Request() req: any, @Body() body: { leaveTypeId: string; startDate: string; endDate: string; reason: string }) {
    return this.leaveService.apply(req.user.employeeId, body);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.DEPARTMENT_HEAD, RoleName.TEAM_LEADER)
  @Get('pending')
  async getPendingRequests() {
    return this.leaveService.getPendingRequests();
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.DEPARTMENT_HEAD, RoleName.TEAM_LEADER)
  @Put(':id/approve')
  async approve(@Request() req: any, @Param('id') id: string) {
    return this.leaveService.approve(id, req.user.id);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.DEPARTMENT_HEAD, RoleName.TEAM_LEADER)
  @Put(':id/reject')
  async reject(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.leaveService.reject(id, body.reason);
  }

  @Get('holidays')
  async getHolidays() {
    return this.leaveService.getHolidays();
  }
}
