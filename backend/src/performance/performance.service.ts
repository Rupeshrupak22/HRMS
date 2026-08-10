import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  async getGoals(employeeId?: string) {
    const where = employeeId ? { employeeId } : {};
    return this.prisma.goal.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async createGoal(data: { employeeId: string; title: string; description?: string; targetValue?: number; dueDate: string }) {
    return this.prisma.goal.create({
      data: {
        employeeId: data.employeeId,
        title: data.title,
        description: data.description,
        targetValue: data.targetValue || 100,
        dueDate: new Date(data.dueDate),
      },
    });
  }

  async updateGoalProgress(id: string, currentValue: number, status?: string) {
    return this.prisma.goal.update({
      where: { id },
      data: { currentValue, status },
    });
  }

  async getReviews(employeeId?: string) {
    const where = employeeId ? { employeeId } : {};
    return this.prisma.performanceReview.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitReview(data: { employeeId: string; selfRating?: number; selfComments?: string; managerRating?: number; managerComments?: string; recommendation?: string }) {
    const finalRating = data.selfRating && data.managerRating ? (data.selfRating + data.managerRating) / 2 : data.managerRating || data.selfRating || 3;
    return this.prisma.performanceReview.create({
      data: {
        employeeId: data.employeeId,
        selfRating: data.selfRating,
        selfComments: data.selfComments,
        managerRating: data.managerRating,
        managerComments: data.managerComments,
        finalRating,
        recommendation: data.recommendation || 'MEETS_EXPECTATIONS',
        status: 'SUBMITTED',
      },
    });
  }
}
