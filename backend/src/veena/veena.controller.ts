import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { VeenaService } from './veena.service';

@Controller('veena-portal')
export class VeenaController {
  constructor(private readonly svc: VeenaService) {}

  @Get('onboarding')
  getOnboarding() { return this.svc.getOnboarding(); }
  @Post('onboarding')
  createOnboarding(@Body() data: any) { return this.svc.createOnboarding(data); }
  @Put('onboarding/:id')
  updateOnboarding(@Param('id') id: string, @Body() data: any) { return this.svc.updateOnboarding(id, data); }
  @Delete('onboarding/:id')
  deleteOnboarding(@Param('id') id: string) { return this.svc.deleteOnboarding(id); }

  @Get('dropouts')
  getDropouts() { return this.svc.getDropouts(); }
  @Post('dropouts')
  createDropout(@Body() data: any) { return this.svc.createDropout(data); }
  @Put('dropouts/:id')
  updateDropout(@Param('id') id: string, @Body() data: any) { return this.svc.updateDropout(id, data); }
  @Delete('dropouts/:id')
  deleteDropout(@Param('id') id: string) { return this.svc.deleteDropout(id); }

  @Get('daily-reports')
  getDailyReports() { return this.svc.getDailyReports(); }
  @Post('daily-reports')
  createDailyReport(@Body() data: any) { return this.svc.createDailyReport(data); }
  @Put('daily-reports/:id')
  updateDailyReport(@Param('id') id: string, @Body() data: any) { return this.svc.updateDailyReport(id, data); }
  @Delete('daily-reports/:id')
  deleteDailyReport(@Param('id') id: string) { return this.svc.deleteDailyReport(id); }
}
