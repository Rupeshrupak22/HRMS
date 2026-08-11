import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssetService } from './asset.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '../prisma/enums';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assets')
export class AssetController {
  constructor(private assetService: AssetService) {}

  @Get()
  async findAll() {
    return this.assetService.findAll();
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.HR_EXECUTIVE)
  @Post()
  async create(@Body() body: any) {
    return this.assetService.create(body);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.HR_EXECUTIVE)
  @Post('assign')
  async assignAsset(@Body() body: { assetId: string; employeeId: string; notes?: string }) {
    return this.assetService.assignAsset(body.assetId, body.employeeId, body.notes);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.HR_EXECUTIVE)
  @Put('return/:assignmentId')
  async returnAsset(@Param('assignmentId') assignmentId: string, @Body() body: { condition?: string }) {
    return this.assetService.returnAsset(assignmentId, body?.condition);
  }
}
