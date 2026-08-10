import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RecruitmentService } from './recruitment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName, CandidateStatus } from '@prisma/client';

@ApiTags('Recruitment / ATS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recruitment')
export class RecruitmentController {
  constructor(private recruitmentService: RecruitmentService) {}

  @Get('jobs')
  async getJobs() {
    return this.recruitmentService.getJobs();
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.HR_EXECUTIVE, RoleName.DEPARTMENT_HEAD)
  @Post('jobs')
  async createJob(@Body() body: any) {
    return this.recruitmentService.createJob(body);
  }

  @Get('candidates')
  async getCandidates(@Query('jobId') jobId?: string) {
    return this.recruitmentService.getCandidates(jobId);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.HR_EXECUTIVE)
  @Post('candidates')
  async createCandidate(@Body() body: any) {
    return this.recruitmentService.createCandidate(body);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.HR_EXECUTIVE)
  @Put('candidates/:id/status')
  async updateCandidateStatus(@Param('id') id: string, @Body() body: { status: CandidateStatus }) {
    return this.recruitmentService.updateCandidateStatus(id, body.status);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.HR_EXECUTIVE)
  @Post('candidates/:id/screen-resume')
  async screenResume(@Param('id') id: string, @Body() body: { resumeText?: string }) {
    return this.recruitmentService.screenResume(id, body?.resumeText);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.HR_EXECUTIVE)
  @Post('offer-letters/generate')
  async generateOfferLetter(
    @Body() body: { candidateId: string; designation: string; offeredCtc: number; joiningDate: string },
  ) {
    return this.recruitmentService.generateOfferLetter(
      body.candidateId,
      body.designation,
      body.offeredCtc,
      body.joiningDate,
    );
  }
}
