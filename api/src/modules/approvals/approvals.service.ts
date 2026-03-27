import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export class ApprovalService {
  constructor(private prisma: PrismaClient) {}

  async findPending(userId: string) {
    return this.prisma.approval.findMany({
      where: { approverId: userId, decision: 'PENDING' },
      include: {
        clientQuote: { include: { rfq: { include: { client: true } } } },
        requisition: { include: { supplier: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async approve(approvalId: string, approverId: string, comments?: string) {
    const approval = await this.prisma.approval.findUnique({ where: { id: approvalId } })
    if (!approval) throw new NotFoundError('Approval')

    const updated = await this.prisma.approval.update({
      where: { id: approvalId },
      data: { decision: 'APPROVED', comments, decidedAt: new Date(), approverId },
    })

    if (approval.entityType === 'CLIENT_QUOTE') {
      await this.prisma.clientQuote.update({
        where: { id: approval.entityId },
        data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date() },
      })
    }

    if (approval.entityType === 'REQUISITION') {
      await this.prisma.requisition.update({
        where: { id: approval.entityId },
        data: { status: 'APPROVED' },
      })
    }

    return updated
  }

  async reject(approvalId: string, approverId: string, comments: string) {
    const approval = await this.prisma.approval.findUnique({ where: { id: approvalId } })
    if (!approval) throw new NotFoundError('Approval')

    const updated = await this.prisma.approval.update({
      where: { id: approvalId },
      data: { decision: 'REJECTED', comments, decidedAt: new Date(), approverId },
    })

    if (approval.entityType === 'CLIENT_QUOTE') {
      await this.prisma.clientQuote.update({
        where: { id: approval.entityId },
        data: { status: 'REJECTED' },
      })
    }

    if (approval.entityType === 'REQUISITION') {
      await this.prisma.requisition.update({
        where: { id: approval.entityId },
        data: { status: 'REJECTED' },
      })
    }

    return updated
  }
}
