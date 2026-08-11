import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpenseStatus } from '../prisma/enums';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  async getMyClaims(employeeId: string) {
    return this.prisma.expenseClaim.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllClaims() {
    return this.prisma.expenseClaim.findMany({
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createClaim(employeeId: string, data: { title: string; category: string; amount: number; expenseDate: string; receiptUrl?: string }) {
    return this.prisma.expenseClaim.create({
      data: {
        employeeId,
        title: data.title,
        category: data.category,
        amount: data.amount,
        expenseDate: new Date(data.expenseDate),
        receiptUrl: data.receiptUrl,
        status: ExpenseStatus.PENDING,
      },
    });
  }

  async updateStatus(id: string, status: ExpenseStatus) {
    const updateData: any = { status };
    if (status === ExpenseStatus.FINANCE_APPROVED) updateData.approvedAt = new Date();
    if (status === ExpenseStatus.REIMBURSED) updateData.reimbursedAt = new Date();
    return this.prisma.expenseClaim.update({
      where: { id },
      data: updateData,
    });
  }
}
