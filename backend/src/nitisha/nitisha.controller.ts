import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { NitishaService } from './nitisha.service';

@Controller('nitisha')
export class NitishaController {
  constructor(private readonly svc: NitishaService) {}

  // Employee Performance
  @Get('performance')
  getPerformances() { return this.svc.getPerformances(); }
  @Post('performance')
  createPerformance(@Body() data: any) { return this.svc.createPerformance(data); }
  @Put('performance/:id')
  updatePerformance(@Param('id') id: string, @Body() data: any) { return this.svc.updatePerformance(id, data); }
  @Delete('performance/:id')
  deletePerformance(@Param('id') id: string) { return this.svc.deletePerformance(id); }

  // Discipline
  @Get('discipline')
  getDiscipline() { return this.svc.getDisciplineCases(); }
  @Post('discipline')
  createDiscipline(@Body() data: any) { return this.svc.createDisciplineCase(data); }
  @Put('discipline/:id')
  updateDiscipline(@Param('id') id: string, @Body() data: any) { return this.svc.updateDisciplineCase(id, data); }
  @Delete('discipline/:id')
  deleteDiscipline(@Param('id') id: string) { return this.svc.deleteDisciplineCase(id); }

  // Relations
  @Get('relations')
  getRelations() { return this.svc.getRelations(); }
  @Post('relations')
  createRelation(@Body() data: any) { return this.svc.createRelation(data); }
  @Put('relations/:id')
  updateRelation(@Param('id') id: string, @Body() data: any) { return this.svc.updateRelation(id, data); }
  @Delete('relations/:id')
  deleteRelation(@Param('id') id: string) { return this.svc.deleteRelation(id); }

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
