import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AravindService {
  constructor(private prisma: PrismaService) {}

  // Retention
  async getRetentionCases() {
    return this.prisma.retentionCase.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async createRetentionCase(data: any) {
    return this.prisma.retentionCase.create({ data });
  }
  async updateRetentionCase(id: string, data: any) {
    return this.prisma.retentionCase.update({ where: { id }, data });
  }
  async deleteRetentionCase(id: string) {
    return this.prisma.retentionCase.delete({ where: { id } });
  }

  // Resignation Tracker
  async getResignationTrackers() {
    return this.prisma.resignationTracker.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async createResignationTracker(data: any) {
    return this.prisma.resignationTracker.create({ data });
  }
  async updateResignationTracker(id: string, data: any) {
    return this.prisma.resignationTracker.update({ where: { id }, data });
  }
  async deleteResignationTracker(id: string) {
    return this.prisma.resignationTracker.delete({ where: { id } });
  }

  // Exit Clearance
  async getExitClearances() {
    return this.prisma.exitClearance.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async createExitClearance(data: any) {
    return this.prisma.exitClearance.create({ data });
  }
  async updateExitClearance(id: string, data: any) {
    return this.prisma.exitClearance.update({ where: { id }, data });
  }
  async deleteExitClearance(id: string) {
    return this.prisma.exitClearance.delete({ where: { id } });
  }

  // F&F Tracker
  async getFnFTrackers() {
    return this.prisma.fnFTracker.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async createFnFTracker(data: any) {
    return this.prisma.fnFTracker.create({ data });
  }
  async updateFnFTracker(id: string, data: any) {
    return this.prisma.fnFTracker.update({ where: { id }, data });
  }
  async deleteFnFTracker(id: string) {
    return this.prisma.fnFTracker.delete({ where: { id } });
  }

  // Employee Complaints
  async getComplaints() {
    return this.prisma.employeeComplaint.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async createComplaint(data: any) {
    return this.prisma.employeeComplaint.create({ data });
  }
  async updateComplaint(id: string, data: any) {
    return this.prisma.employeeComplaint.update({ where: { id }, data });
  }
  async deleteComplaint(id: string) {
    return this.prisma.employeeComplaint.delete({ where: { id } });
  }

  // Exit Interview
  async getExitInterviews() {
    return this.prisma.exitInterview.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async createExitInterview(data: any) {
    return this.prisma.exitInterview.create({ data });
  }
  async updateExitInterview(id: string, data: any) {
    return this.prisma.exitInterview.update({ where: { id }, data });
  }
  async deleteExitInterview(id: string) {
    return this.prisma.exitInterview.delete({ where: { id } });
  }

  // Daily Reports
  async getDailyReports() {
    return this.prisma.aravindDailyReport.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async createDailyReport(data: any) {
    return this.prisma.aravindDailyReport.create({ data });
  }
  async updateDailyReport(id: string, data: any) {
    return this.prisma.aravindDailyReport.update({ where: { id }, data });
  }
  async deleteDailyReport(id: string) {
    return this.prisma.aravindDailyReport.delete({ where: { id } });
  }
}
