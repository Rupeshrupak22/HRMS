import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';
import { RoleName } from '@prisma/client';

@Injectable()
export class AiService {
  private ai: GoogleGenAI | null = null;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'AIzaSyDemoKeyForAdyapanHRMS') {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async handleCopilotQuery(user: { id: string; role: RoleName; employeeId?: string }, query: string) {
    const lowerQuery = query.toLowerCase();

    // Sensitive payroll RBAC check
    if (lowerQuery.includes('salary') || lowerQuery.includes('payroll') || lowerQuery.includes('ctc')) {
      const allowedRoles: RoleName[] = [RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.FINANCE];
      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenException('Access Denied: You do not have permission to query company payroll or salary data via HR Copilot.');
      }
    }

    // Direct system data lookup for fast & accurate response
    let contextData = '';

    if (lowerQuery.includes('absent') || lowerQuery.includes('attendance') || lowerQuery.includes('present')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const records = await this.prisma.attendanceRecord.findMany({ where: { date: today } });
      const totalActive = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
      const presentCount = records.length;
      contextData = `Today's Active Employees: ${totalActive}. Present/Late Check-ins: ${presentCount}. Unreported/Absent: ${totalActive - presentCount}.`;
    } else if (lowerQuery.includes('leave') || lowerQuery.includes('approval')) {
      const pendingCount = await this.prisma.leaveRequest.count({ where: { status: 'PENDING' } });
      contextData = `There are currently ${pendingCount} pending leave requests requiring approval.`;
    } else if (lowerQuery.includes('payroll') || lowerQuery.includes('tech') || lowerQuery.includes('total')) {
      const activeEmps = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
      const salarySum = await this.prisma.salaryStructure.aggregate({ _sum: { ctc: true } });
      contextData = `Total active employees: ${activeEmps}. Annual CTC payroll budget: ₹${(salarySum._sum.ctc || 0).toLocaleString('en-IN')}.`;
    } else {
      const activeEmps = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
      const depts = await this.prisma.department.findMany({ select: { name: true, _count: { select: { employees: true } } } });
      contextData = `Company: Adyapan Edutech Pvt. Ltd. Total Active Employees: ${activeEmps}. Departments: ${depts.map((d) => `${d.name} (${d._count.employees})`).join(', ')}.`;
    }

    if (this.ai) {
      try {
        const prompt = `You are HR AI Copilot for Adyapan HRMS. System Context Data: ${contextData}. User Question: "${query}". Answer concisely, professionally, and accurately in markdown.`;
        const res = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return { answer: res.text || contextData, contextData };
      } catch (err) {
        console.error('Gemini Copilot Error:', err);
      }
    }

    // Smart fallback answer
    return {
      answer: `**Adyapan HR Copilot Summary**:\n\n${contextData}\n\n*System query processed cleanly for role ${user.role}*`,
      contextData,
    };
  }
}
