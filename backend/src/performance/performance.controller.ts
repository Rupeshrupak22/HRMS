import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Performance & Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private performanceService: PerformanceService) {}

  @Get('goals')
  async getGoals(@Request() req: any, @Query('employeeId') employeeId?: string) {
    const targetId = employeeId || req.user.employeeId;
    return this.performanceService.getGoals(targetId);
  }

  @Post('goals')
  async createGoal(@Body() body: any) {
    return this.performanceService.createGoal(body);
  }

  @Put('goals/:id')
  async updateGoalProgress(@Param('id') id: string, @Body() body: { currentValue: number; status?: string }) {
    return this.performanceService.updateGoalProgress(id, body.currentValue, body.status);
  }

  @Get('reviews')
  async getReviews(@Request() req: any, @Query('employeeId') employeeId?: string) {
    const targetId = employeeId || req.user.employeeId;
    return this.performanceService.getReviews(targetId);
  }

  @Post('reviews')
  async submitReview(@Body() body: any) {
    return this.performanceService.submitReview(body);
  }
}
