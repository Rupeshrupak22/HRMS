import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { VeenaController } from './veena.controller';

@Module({
  controllers: [ReportsController, VeenaController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
