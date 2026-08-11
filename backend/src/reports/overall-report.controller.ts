import { Controller, Get, Post, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('overall-report')
export class OverallReportController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getReports() {
    return this.prisma.overallReport.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post()
  async submitReport(@Body() data: any) {
    return this.prisma.overallReport.create({ data });
  }
}
