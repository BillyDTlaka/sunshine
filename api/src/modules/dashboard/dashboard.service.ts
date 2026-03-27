import { PrismaClient } from '@prisma/client'

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  async getSummary() {
    const [openRfqs, pendingApprovals, posReceived, deliveriesConfirmed, invoicesOutstanding, totalPipelineValue] = await Promise.all([
      this.prisma.rfq.count({ where: { status: { notIn: ['CLOSED', 'LOST', 'CANCELLED'] } } }),
      this.prisma.approval.count({ where: { decision: 'PENDING' } }),
      this.prisma.purchaseOrder.count(),
      this.prisma.delivery.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.clientInvoice.count({ where: { status: { in: ['ISSUED', 'OVERDUE'] } } }),
      this.prisma.clientQuote.aggregate({ where: { status: 'APPROVED' }, _sum: { totalSell: true } }),
    ])

    return {
      openRfqs,
      pendingApprovals,
      posReceived,
      deliveriesConfirmed,
      invoicesOutstanding,
      totalPipelineValue: totalPipelineValue._sum.totalSell ?? 0,
    }
  }

  async getPipeline() {
    const statusGroups = await this.prisma.rfq.groupBy({
      by: ['status'],
      _count: { _all: true },
    })
    return statusGroups.map(g => ({ status: g.status, count: g._count._all }))
  }

  async getAlerts(userId: string) {
    const [overdueSupplierQuotes, missingPods, pendingApprovals, overdueInvoices] = await Promise.all([
      this.prisma.supplierQuote.findMany({
        where: { status: 'REQUESTED', createdAt: { lt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } },
        include: { supplier: true, rfq: true },
        take: 5,
      }),
      this.prisma.delivery.findMany({
        where: { status: 'DELIVERED', deliveryNote: null },
        include: { rfq: true },
        take: 5,
      }),
      this.prisma.approval.findMany({
        where: { approverId: userId, decision: 'PENDING' },
        take: 5,
      }),
      this.prisma.clientInvoice.findMany({
        where: { status: 'ISSUED', dueDate: { lt: new Date() } },
        include: { client: true },
        take: 5,
      }),
    ])

    return { overdueSupplierQuotes, missingPods, pendingApprovals, overdueInvoices }
  }
}
