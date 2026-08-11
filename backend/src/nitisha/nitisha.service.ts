import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NitishaService {
  constructor(private prisma: PrismaService) {}

  // Employee Performance
  async getPerformances() {
    return this.prisma.employeePerformance.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async createPerformance(data: any) {
    return this.prisma.employeePerformance.create({ data });
  }
  async updatePerformance(id: string, data: any) {
    return this.prisma.employeePerformance.update({ where: { id }, data });
  }
  async deletePerformance(id: string) {
    return this.prisma.employeePerformance.delete({ where: { id } });
  }

  // Discipline
  async getDisciplineCases() {
    return this.prisma.disciplineCase.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async createDisciplineCase(data: any) {
    return this.prisma.disciplineCase.create({ data });
  }
  async updateDisciplineCase(id: string, data: any) {
    return this.prisma.disciplineCase.update({ where: { id }, data });
  }
  async deleteDisciplineCase(id: string) {
    return this.prisma.disciplineCase.delete({ where: { id } });
  }

  // Relations
  async getRelations() {
    return this.prisma.employeeRelation.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async createRelation(data: any) {
    return this.prisma.employeeRelation.create({ data });
  }
  async updateRelation(id: string, data: any) {
    return this.prisma.employeeRelation.update({ where: { id }, data });
  }
  async deleteRelation(id: string) {
    return this.prisma.employeeRelation.delete({ where: { id } });
  }

  // Daily Reports
  async getDailyReports() {
    return this.prisma.nitishaDailyReport.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async createDailyReport(data: any) {
    return this.prisma.nitishaDailyReport.create({ data });
  }
  async updateDailyReport(id: string, data: any) {
    return this.prisma.nitishaDailyReport.update({ where: { id }, data });
  }
  async deleteDailyReport(id: string) {
    return this.prisma.nitishaDailyReport.delete({ where: { id } });
  }
}
