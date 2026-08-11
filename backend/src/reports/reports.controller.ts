import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard-metrics')
  async getDashboardMetrics() {
    return this.reportsService.getDashboardMetrics();
  }

  @Get('veena-dashboard')
  async getVeenaDashboard() {
    return this.reportsService.getVeenaDashboard();
  }

  @Post('daily')
  async submitDailyReport(@Body() body: any, @Request() req: any) {
    return this.reportsService.submitDailyReport(body, req.user);
  }

  @Get('daily')
  async getDailyReports() {
    return this.reportsService.getDailyReports();
  }

  @Put('daily/:id')
  async updateDailyReport(@Param('id') id: string, @Body() body: any) {
    return this.reportsService.updateDailyReport(id, body);
  }

  @Put('daily/:id/approve')
  async approveReport(@Param('id') id: string) {
    return this.reportsService.updateDailyReportStatus(id, 'APPROVED');
  }

  @Put('daily/:id/reject')
  async rejectReport(@Param('id') id: string) {
    return this.reportsService.updateDailyReportStatus(id, 'REJECTED');
  }

  @Put('daily/:id/send')
  async sendReport(@Param('id') id: string) {
    return this.reportsService.sendReport(id);
  }

  @Delete('daily/:id')
  async deleteDailyReport(@Param('id') id: string) {
    return this.reportsService.deleteDailyReport(id);
  }
}
