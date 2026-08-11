import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '../prisma/enums';

@ApiTags('Organization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private orgService: OrganizationService) {}

  @Get('departments')
  async getDepartments() {
    return this.orgService.getDepartments();
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN)
  @Post('departments')
  async createDepartment(@Body() body: { name: string; code: string; description?: string }) {
    return this.orgService.createDepartment(body);
  }

  @Get('teams')
  async getTeams() {
    return this.orgService.getTeams();
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN)
  @Post('teams')
  async createTeam(@Body() body: { name: string; departmentId: string; leaderId?: string }) {
    return this.orgService.createTeam(body);
  }

  @Get('designations')
  async getDesignations() {
    return this.orgService.getDesignations();
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN)
  @Post('designations')
  async createDesignation(@Body() body: { title: string; code: string; level?: number; description?: string }) {
    return this.orgService.createDesignation(body);
  }
}
