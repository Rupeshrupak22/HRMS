import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleName } from '@prisma/client';

@Injectable()
export class AiService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.x.ai/v1/chat/completions';

  constructor(private prisma: PrismaService) {
    this.apiKey = process.env.XAI_API_KEY || null;
  }

  async handleCopilotQuery(user: { id: string; role: RoleName; employeeId?: string }, query: string) {
    const lowerQuery = query.toLowerCase();

    // Sensitive payroll RBAC check
    if (lowerQuery.includes('salary') || lowerQuery.includes('payroll') || lowerQuery.includes('ctc')) {
      const allowedRoles: RoleName[] = [RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.FINANCE];
      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenException('Access Denied: You do not have permission to query salary data.');
      }
    }

    // Greetings
    if (lowerQuery.includes('good morning') || lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey') || lowerQuery.includes('namaste') || lowerQuery.includes('gm')) {
      const aiAnswer = await this.callXAI('You are a warm, friendly HR assistant. Respond to this greeting briefly in English (2-3 lines). Be professional and encouraging.', query);
      if (aiAnswer) return { answer: aiAnswer, contextData: '' };
      return { answer: '👋 **Good morning!** I am Adyapan HR AI Copilot. How can I help you today?', contextData: '' };
    }

    // Build context from real DB data
    let contextData = '';

    if (lowerQuery.includes('absent') || lowerQuery.includes('attendance') || lowerQuery.includes('present')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const records = await this.prisma.attendanceRecord.findMany({ where: { date: today } });
      const totalActive = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
      const presentCount = records.length;
      contextData = `Today's Active Employees: ${totalActive}. Present/Check-ins: ${presentCount}. Absent/Unreported: ${totalActive - presentCount}.`;
    } else if (lowerQuery.includes('leave') || lowerQuery.includes('approval')) {
      const pendingCount = await this.prisma.leaveRequest.count({ where: { status: 'PENDING' } });
      contextData = `Pending leave requests: ${pendingCount}.`;
    } else if (lowerQuery.includes('payroll') || lowerQuery.includes('total')) {
      const activeEmps = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
      const salarySum = await this.prisma.salaryStructure.aggregate({ _sum: { ctc: true } });
      contextData = `Active employees: ${activeEmps}. Annual CTC budget: INR ${(salarySum._sum.ctc || 0).toLocaleString('en-IN')}.`;
    } else {
      const activeEmps = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
      const depts = await this.prisma.department.findMany({ select: { name: true, _count: { select: { employees: true } } } });
      const deptList = depts.filter(d => d._count.employees > 0).map((d) => `${d.name}: ${d._count.employees}`).join(', ');
      contextData = `Adyapan Edutech — ${activeEmps} active employees. Departments: ${deptList || 'No data yet'}.`;
    }

    // Try xAI API
    const aiAnswer = await this.callXAI(
      'You are Adyapan HR AI Copilot. Answer HR questions concisely in English using markdown. Use the context data provided. Be professional and helpful.',
      `Context: ${contextData}\n\nQuestion: ${query}`,
    );
    if (aiAnswer) return { answer: aiAnswer, contextData };

    // Smart fallback (when API has no credits)
    return { answer: this.buildSmartResponse(query, contextData), contextData };
  }

  private async callXAI(systemPrompt: string, userMessage: string): Promise<string | null> {
    if (!this.apiKey) return null;
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: 'grok-3-mini-fast',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (err) {
      return null;
    }
  }

  private buildSmartResponse(query: string, contextData: string): string {
    const lower = query.toLowerCase();
    if (lower.includes('absent') || lower.includes('attendance')) {
      return `📊 **Attendance Summary**\n\n${contextData}\n\n💡 *Check the Attendance module for detailed logs.*`;
    }
    if (lower.includes('leave')) {
      return `📋 **Leave Status**\n\n${contextData}\n\n💡 *Go to Leave Management to approve/reject requests.*`;
    }
    if (lower.includes('payroll') || lower.includes('salary')) {
      return `💰 **Payroll Overview**\n\n${contextData}\n\n💡 *Visit Payroll module for detailed breakdowns.*`;
    }
    if (lower.includes('employee') || lower.includes('team') || lower.includes('department')) {
      return `👥 **Organization Overview**\n\n${contextData}\n\n💡 *View Employees section for full directory.*`;
    }
    if (lower.includes('recruitment') || lower.includes('candidate') || lower.includes('hiring') || lower.includes('onboarding')) {
      return `🎯 **Recruitment & Onboarding**\n\n${contextData}\n\n💡 *Check Recruitment Tracker for pipeline details.*`;
    }
    if (lower.includes('help') || lower.includes('what can you do')) {
      return `🤖 **I can help you with:**\n\n- 📊 Attendance & absence reports\n- 📋 Leave approval status\n- 💰 Payroll & CTC information\n- 👥 Employee & department data\n- 🎯 Recruitment pipeline status\n\n*Just ask!*`;
    }
    return `📌 **HR Copilot Response**\n\n${contextData}\n\n*Need anything else? Just ask!*`;
  }
}
