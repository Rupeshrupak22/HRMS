import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '../prisma/enums';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Post('presigned-url')
  async getPresignedUploadUrl(
    @Request() req: any,
    @Body() body: { fileName: string; category: string },
  ) {
    return this.documentService.getPresignedUploadUrl(req.user.employeeId, body.fileName, body.category);
  }

  @Post('record')
  async saveDocumentRecord(
    @Request() req: any,
    @Body() body: { title: string; category: string; fileUrl: string; fileSize?: number },
  ) {
    return this.documentService.saveDocumentRecord(
      req.user.employeeId,
      body.title,
      body.category,
      body.fileUrl,
      body.fileSize,
    );
  }

  @Get('my-documents')
  async getMyDocuments(@Request() req: any) {
    return this.documentService.getMyDocuments(req.user.employeeId);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.HR_ADMIN, RoleName.HR_EXECUTIVE)
  @Put(':id/verify')
  async verifyDocument(@Param('id') id: string) {
    return this.documentService.verifyDocument(id);
  }
}
