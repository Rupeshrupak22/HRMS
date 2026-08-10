import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async getDepartments() {
    return this.prisma.department.findMany({
      include: {
        teams: true,
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(data: { name: string; code: string; description?: string }) {
    return this.prisma.department.create({ data });
  }

  async getTeams() {
    return this.prisma.team.findMany({
      include: { department: true, _count: { select: { employees: true } } },
    });
  }

  async createTeam(data: { name: string; departmentId: string; leaderId?: string }) {
    return this.prisma.team.create({ data });
  }

  async getDesignations() {
    return this.prisma.designation.findMany({
      orderBy: { level: 'desc' },
      include: { _count: { select: { employees: true } } },
    });
  }

  async createDesignation(data: { title: string; code: string; level?: number; description?: string }) {
    return this.prisma.designation.create({ data });
  }
}
