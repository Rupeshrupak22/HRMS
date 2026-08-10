import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';
import { CandidateStatus } from '@prisma/client';

@Injectable()
export class RecruitmentService {
  private ai: GoogleGenAI | null = null;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'AIzaSyDemoKeyForAdyapanHRMS') {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async getJobs() {
    return this.prisma.jobOpening.findMany({
      include: {
        department: true,
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createJob(data: any) {
    return this.prisma.jobOpening.create({ data });
  }

  async getCandidates(jobId?: string) {
    const where = jobId ? { jobId } : {};
    return this.prisma.candidate.findMany({
      where,
      include: { job: true, offerLetter: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCandidate(data: any) {
    return this.prisma.candidate.create({ data });
  }

  async updateCandidateStatus(id: string, status: CandidateStatus) {
    return this.prisma.candidate.update({
      where: { id },
      data: { status },
    });
  }

  async screenResume(candidateId: string, resumeText?: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { job: true },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');

    let matchScore = 85.0;
    let aiAnalysis = 'Strong tech stack alignment with experience in React, Node.js, and TypeScript.';

    if (this.ai && resumeText) {
      try {
        const prompt = `Analyze this candidate resume for Job: "${candidate.job.title}". Job Requirements: "${candidate.job.requirements}". Candidate Resume text: "${resumeText}".
        Provide JSON response with keys: "matchScore" (number 0-100) and "analysis" (string summary of fit, skill gaps, recommendation).`;
        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        const text = response.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          matchScore = parsed.matchScore || matchScore;
          aiAnalysis = parsed.analysis || aiAnalysis;
        }
      } catch (err) {
        console.error('Gemini ATS screening error:', err);
      }
    }

    return this.prisma.candidate.update({
      where: { id: candidateId },
      data: { matchScore, aiAnalysis },
    });
  }

  async generateOfferLetter(candidateId: string, designation: string, offeredCtc: number, joiningDate: string) {
    return this.prisma.offerLetter.upsert({
      where: { candidateId },
      update: {
        designation,
        offeredCtc,
        joiningDate: new Date(joiningDate),
        status: 'SENT',
      },
      create: {
        candidateId,
        designation,
        offeredCtc,
        joiningDate: new Date(joiningDate),
        status: 'SENT',
      },
    });
  }
}
