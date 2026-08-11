import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssetStatus } from '../prisma/enums';

@Injectable()
export class AssetService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.asset.findMany({
      include: {
        assignments: {
          include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
          orderBy: { assignedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { assetTag: string; name: string; category: string; serialNumber?: string }) {
    return this.prisma.asset.create({ data });
  }

  async assignAsset(assetId: string, employeeId: string, notes?: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('Asset not found');

    await this.prisma.asset.update({
      where: { id: assetId },
      data: { status: AssetStatus.ASSIGNED },
    });

    return this.prisma.assetAssignment.create({
      data: {
        assetId,
        employeeId,
        notes,
      },
    });
  }

  async returnAsset(assignmentId: string, condition?: string) {
    const assignment = await this.prisma.assetAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.prisma.asset.update({
      where: { id: assignment.assetId },
      data: { status: AssetStatus.AVAILABLE },
    });

    return this.prisma.assetAssignment.update({
      where: { id: assignmentId },
      data: { returnedAt: new Date(), condition: condition || 'GOOD' },
    });
  }
}
