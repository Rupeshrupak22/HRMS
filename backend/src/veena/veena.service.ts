import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VeenaService {
  constructor(private prisma: PrismaService) {}

  // Onboarding
  async getOnboarding() { return this.prisma.onboardingTracker.findMany({ orderBy: { createdAt: 'desc' } }); }
  async createOnboarding(data: any) { return this.prisma.onboardingTracker.create({ data }); }
  async updateOnboarding(id: string, data: any) { return this.prisma.onboardingTracker.update({ where: { id }, data }); }
  async deleteOnboarding(id: string) { return this.prisma.onboardingTracker.delete({ where: { id } }); }

  // Dropout (uses existing DropoutRecord model)
  async getDropouts() { return this.prisma.dropoutRecord.findMany({ orderBy: { createdAt: 'desc' } }); }
  async createDropout(data: any) { return this.prisma.dropoutRecord.create({ data }); }
  async updateDropout(id: string, data: any) { return this.prisma.dropoutRecord.update({ where: { id }, data }); }
  async deleteDropout(id: string) { return this.prisma.dropoutRecord.delete({ where: { id } }); }

  // Daily Reports
  async getDailyReports() { return this.prisma.veenaDailyReport.findMany({ orderBy: { createdAt: 'desc' } }); }
  async createDailyReport(data: any) { return this.prisma.veenaDailyReport.create({ data }); }
  async updateDailyReport(id: string, data: any) { return this.prisma.veenaDailyReport.update({ where: { id }, data }); }
  async deleteDailyReport(id: string) { return this.prisma.veenaDailyReport.delete({ where: { id } }); }
}
