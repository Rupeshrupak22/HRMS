import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class DocumentService {
  private s3: S3Client | null = null;
  private bucketName: string;

  constructor(private prisma: PrismaService) {
    this.bucketName = process.env.AWS_S3_BUCKET || 'adyapan-hrms-storage';
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3 = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    }
  }

  async getPresignedUploadUrl(employeeId: string, fileName: string, category: string) {
    const key = `documents/${employeeId}/${Date.now()}-${fileName}`;

    if (this.s3) {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
      return { uploadUrl, fileKey: key, simulatedUrl: `https://${this.bucketName}.s3.amazonaws.com/${key}` };
    }

    return {
      uploadUrl: `https://${this.bucketName}.s3.amazonaws.com/${key}?presigned=demo`,
      fileKey: key,
      simulatedUrl: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
    };
  }

  async saveDocumentRecord(employeeId: string, title: string, category: string, fileUrl: string, fileSize?: number) {
    return this.prisma.employeeDocument.create({
      data: {
        employeeId,
        title,
        category,
        fileUrl,
        fileSize: fileSize || 1024 * 500,
        isVerified: false,
      },
    });
  }

  async getMyDocuments(employeeId: string) {
    return this.prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyDocument(id: string) {
    return this.prisma.employeeDocument.update({
      where: { id },
      data: { isVerified: true },
    });
  }
}
