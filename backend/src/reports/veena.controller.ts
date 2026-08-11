import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Veena Data')
@Controller('veena')
export class VeenaController {
  constructor(private prisma: PrismaService) {}

  // ===== DROPOUT RECORDS =====
  @Get('dropouts')
  async getDropouts() {
    return this.prisma.dropoutRecord.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('dropouts')
  async createDropout(@Body() body: any) {
    return this.prisma.dropoutRecord.create({ data: body });
  }

  @Put('dropouts/:id')
  async updateDropout(@Param('id') id: string, @Body() body: any) {
    return this.prisma.dropoutRecord.update({ where: { id }, data: body });
  }

  @Delete('dropouts/:id')
  async deleteDropout(@Param('id') id: string) {
    await this.prisma.dropoutRecord.delete({ where: { id } });
    return { success: true };
  }

  // ===== WORK TASKS =====
  @Get('tasks')
  async getTasks() {
    return this.prisma.workTask.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('tasks')
  async createTask(@Body() body: any) {
    return this.prisma.workTask.create({ data: { title: body.title, dueDate: body.dueDate || new Date().toISOString().split('T')[0], priority: body.priority || 'MEDIUM', userEmail: body.userEmail || 'veena@adyapan.com' } });
  }

  @Put('tasks/:id')
  async updateTask(@Param('id') id: string, @Body() body: any) {
    return this.prisma.workTask.update({ where: { id }, data: body });
  }

  @Delete('tasks/:id')
  async deleteTask(@Param('id') id: string) {
    await this.prisma.workTask.delete({ where: { id } });
    return { success: true };
  }

  // ===== RECRUITMENT ENTRIES =====
  @Get('recruitment')
  async getRecruitment() {
    return this.prisma.recruitmentEntry.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('recruitment')
  async createRecruitment(@Body() body: any) {
    return this.prisma.recruitmentEntry.create({ data: body });
  }

  @Put('recruitment/:id')
  async updateRecruitment(@Param('id') id: string, @Body() body: any) {
    return this.prisma.recruitmentEntry.update({ where: { id }, data: body });
  }

  @Delete('recruitment/:id')
  async deleteRecruitment(@Param('id') id: string) {
    await this.prisma.recruitmentEntry.delete({ where: { id } });
    return { success: true };
  }
}
