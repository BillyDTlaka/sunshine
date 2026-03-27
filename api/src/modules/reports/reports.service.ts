import { PrismaClient } from '@prisma/client'

export class ReportService {
  constructor(private prisma: PrismaClient) {}

  async pipeline({ from, to, accountManagerId }: any) {
    const where: any = {}
    if (from) where.createdAt = { gte: new Date(from) }
    if (to) where.createdAt = { ...where.createdAt, lte: new Date(to) }
    if (accountManagerId) where.accountManagerId = accountManagerId

    return this.prisma.rfq.findMany({
      where,
      select: {
        id: true, referenceNumber: true, status: true, createdAt: true,
        client: { select: { name: true } },
        accountManager: { select: { firstName: true, lastName: true } },
        clientQuotes: { select: { totalSell: true, grossMarginPct: true }, orderBy: { versionNumber: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async margins({ from, to, clientId }: any) {
    const where: any = { status: { in: ['APPROVED', 'SENT', 'ACCEPTED'] } }
    if (clientId) where.rfq = { clientId }

    return this.prisma.clientQuote.findMany({
      where,
      select: {
        id: true, versionNumber: true, totalCost: true, totalSell: true, grossMargin: true, grossMarginPct: true, createdAt: true,
        rfq: { select: { referenceNumber: true, client: { select: { name: true } } } },
      },
    })
  }

  async winLoss({ from, to }: any) {
    const [won, lost, total] = await Promise.all([
      this.prisma.rfq.count({ where: { status: { in: ['PO_RECEIVED', 'CLOSED'] } } }),
      this.prisma.rfq.count({ where: { status: 'LOST' } }),
      this.prisma.rfq.count({ where: { status: { in: ['PO_RECEIVED', 'CLOSED', 'LOST'] } } }),
    ])
    return { won, lost, total, winRate: total > 0 ? (won / total) * 100 : 0 }
  }

  async supplierPayments({ supplierId, from, to }: any) {
    const where: any = {}
    if (supplierId) where.supplierId = supplierId
    if (from) where.paymentDate = { gte: new Date(from) }
    if (to) where.paymentDate = { ...where.paymentDate, lte: new Date(to) }
    return this.prisma.supplierPayment.findMany({
      where,
      include: { supplier: true, requisition: true },
      orderBy: { paymentDate: 'desc' },
    })
  }

  async deliveryCycle() {
    const deliveries = await this.prisma.delivery.findMany({
      where: { status: 'CONFIRMED', actualDate: { not: null } },
      include: { rfq: { include: { purchaseOrders: true } } },
    })
    return deliveries.map(d => {
      const po = d.rfq.purchaseOrders[0]
      const days = po && d.actualDate
        ? Math.round((d.actualDate.getTime() - po.receivedAt.getTime()) / (1000 * 60 * 60 * 24))
        : null
      return { deliveryId: d.id, rfqRef: d.rfq.referenceNumber, poDate: po?.poDate, deliveryDate: d.actualDate, cycleTimeDays: days }
    })
  }

  async receivables() {
    return this.prisma.clientInvoice.findMany({
      where: { status: { in: ['ISSUED', 'OVERDUE'] } },
      include: { client: true, rfq: true },
      orderBy: { dueDate: 'asc' },
    })
  }
}
