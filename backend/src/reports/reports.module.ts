import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { VeenaController } from './veena.controller';
import { OverallReportController } from './overall-report.controller';

@Module({
  controllers: [ReportsController, VeenaController, OverallReportController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
