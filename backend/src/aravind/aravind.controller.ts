import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { AravindService } from './aravind.service';

@Controller('aravind')
export class AravindController {
  constructor(private readonly svc: AravindService) {}

  // Retention
  @Get('retention')
  getRetention() { return this.svc.getRetentionCases(); }
  @Post('retention')
  createRetention(@Body() data: any) { return this.svc.createRetentionCase(data); }
  @Put('retention/:id')
  updateRetention(@Param('id') id: string, @Body() data: any) { return this.svc.updateRetentionCase(id, data); }
  @Delete('retention/:id')
  deleteRetention(@Param('id') id: string) { return this.svc.deleteRetentionCase(id); }

  // Resignation
  @Get('resignation')
  getResignation() { return this.svc.getResignationTrackers(); }
  @Post('resignation')
  createResignation(@Body() data: any) { return this.svc.createResignationTracker(data); }
  @Put('resignation/:id')
  updateResignation(@Param('id') id: string, @Body() data: any) { return this.svc.updateResignationTracker(id, data); }
  @Delete('resignation/:id')
  deleteResignation(@Param('id') id: string) { return this.svc.deleteResignationTracker(id); }

  // Exit Clearance
  @Get('exit-clearance')
  getExitClearance() { return this.svc.getExitClearances(); }
  @Post('exit-clearance')
  createExitClearance(@Body() data: any) { return this.svc.createExitClearance(data); }
  @Put('exit-clearance/:id')
  updateExitClearance(@Param('id') id: string, @Body() data: any) { return this.svc.updateExitClearance(id, data); }
  @Delete('exit-clearance/:id')
  deleteExitClearance(@Param('id') id: string) { return this.svc.deleteExitClearance(id); }

  // F&F
  @Get('fnf')
  getFnF() { return this.svc.getFnFTrackers(); }
  @Post('fnf')
  createFnF(@Body() data: any) { return this.svc.createFnFTracker(data); }
  @Put('fnf/:id')
  updateFnF(@Param('id') id: string, @Body() data: any) { return this.svc.updateFnFTracker(id, data); }
  @Delete('fnf/:id')
  deleteFnF(@Param('id') id: string) { return this.svc.deleteFnFTracker(id); }

  // Complaints
  @Get('complaints')
  getComplaints() { return this.svc.getComplaints(); }
  @Post('complaints')
  createComplaint(@Body() data: any) { return this.svc.createComplaint(data); }
  @Put('complaints/:id')
  updateComplaint(@Param('id') id: string, @Body() data: any) { return this.svc.updateComplaint(id, data); }
  @Delete('complaints/:id')
  deleteComplaint(@Param('id') id: string) { return this.svc.deleteComplaint(id); }

  // Exit Interview
  @Get('exit-interview')
  getExitInterview() { return this.svc.getExitInterviews(); }
  @Post('exit-interview')
  createExitInterview(@Body() data: any) { return this.svc.createExitInterview(data); }
  @Put('exit-interview/:id')
  updateExitInterview(@Param('id') id: string, @Body() data: any) { return this.svc.updateExitInterview(id, data); }
  @Delete('exit-interview/:id')
  deleteExitInterview(@Param('id') id: string) { return this.svc.deleteExitInterview(id); }

  // Daily Reports
  @Get('daily-reports')
  getDailyReports() { return this.svc.getDailyReports(); }
  @Post('daily-reports')
  createDailyReport(@Body() data: any) { return this.svc.createDailyReport(data); }
  @Put('daily-reports/:id')
  updateDailyReport(@Param('id') id: string, @Body() data: any) { return this.svc.updateDailyReport(id, data); }
  @Delete('daily-reports/:id')
  deleteDailyReport(@Param('id') id: string) { return this.svc.deleteDailyReport(id); }
}
