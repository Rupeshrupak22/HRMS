import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '../prisma/enums';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('check-in')
  async checkIn(@Request() req: any, @Body() body: { notes?: string }) {
    return this.attendanceService.checkIn(req.user.employeeId, body?.notes);
  }

  @Post('check-out')
  async checkOut(@Request() req: any, @Body() body: { notes?: string }) {
    return this.attendanceService.checkOut(req.user.employeeId, body?.notes);
  }

  @Get('my-logs')
  async getMyLogs(@Request() req: any) {
    return this.attendanceService.getMyLogs(req.user.employeeId);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.HR_EXECUTIVE, RoleName.DEPARTMENT_HEAD)
  @Get('daily-summary')
  async getDailySummary() {
    return this.attendanceService.getDailySummary();
  }
}
