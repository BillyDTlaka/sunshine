import { PrismaClient } from '@prisma/client'
import { NotFoundError, AppError } from '../../shared/errors/AppError'

export class ClientQuoteService {
  constructor(private prisma: PrismaClient) {}

  async findByRfq(rfqId: string) {
    return this.prisma.clientQuote.findMany({
      where: { rfqId },
      include: { lines: { orderBy: { lineNumber: 'asc' } }, preparedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { versionNumber: 'desc' },
    })
  }

  async findById(id: string) {
    const quote = await this.prisma.clientQuote.findUnique({
      where: { id },
      include: {
        lines: { orderBy: { lineNumber: 'asc' } },
        rfq: { include: { client: true } },
        preparedBy: { select: { id: true, firstName: true, lastName: true } },
        approvals: { include: { approver: { select: { id: true, firstName: true, lastName: true } } } },
      },
    })
    if (!quote) throw new NotFoundError('ClientQuote')
    return quote
  }

  async create(rfqId: string, data: any, userId: string) {
    const existing = await this.prisma.clientQuote.count({ where: { rfqId } })

    const lines = data.lines ?? []
    const calculatedLines = lines.map((l: any) => {
      const markupPct = l.markupPct ?? data.defaultMarkupPct ?? 0
      const unitSell = l.category === 'LABOUR_FIXED' || l.category === 'LABOUR_TM'
        ? (l.labourFixedFee ?? (l.labourRate ?? 0) * (l.labourHoursEstimated ?? 0))
        : l.unitCost * (1 + markupPct / 100)
      const totalSell = l.category === 'LABOUR_FIXED' || l.category === 'LABOUR_TM'
        ? unitSell
        : unitSell * l.quantity
      const totalCost = l.unitCost * l.quantity
      return { ...l, markupPct, unitSell, totalSell, totalCost }
    })

    const totalCost = calculatedLines.reduce((s: number, l: any) => s + (l.totalCost ?? 0), 0)
    const totalSell = calculatedLines.reduce((s: number, l: any) => s + (l.totalSell ?? 0), 0)
    const grossMargin = totalSell - totalCost
    const grossMarginPct = totalSell > 0 ? (grossMargin / totalSell) * 100 : 0

    return this.prisma.clientQuote.create({
      data: {
        rfqId,
        versionNumber: existing + 1,
        defaultMarkupPct: data.defaultMarkupPct ?? 0,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        terms: data.terms,
        notes: data.notes,
        totalCost,
        totalSell,
        grossMargin,
        grossMarginPct,
        preparedById: userId,
        lines: calculatedLines.length ? { create: calculatedLines } : undefined,
      },
      include: { lines: true },
    })
  }

  async submitForApproval(id: string, userId: string) {
    const quote = await this.findById(id)
    if (quote.status !== 'DRAFT') throw new AppError('Only DRAFT quotes can be submitted for approval', 422)

    return this.prisma.clientQuote.update({
      where: { id },
      data: {
        status: 'SUBMITTED_FOR_REVIEW',
        approvals: {
          create: {
            entityType: 'CLIENT_QUOTE',
            approverId: userId,
            decision: 'PENDING',
            level: 1,
          },
        },
      },
    })
  }

  async markSent(id: string, _sentTo?: string) {
    const quote = await this.findById(id)
    if (quote.status !== 'APPROVED') throw new AppError('Only APPROVED quotes can be sent', 422)
    return this.prisma.clientQuote.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    })
  }

  async updateLine(lineId: string, data: any) {
    return this.prisma.quoteLine.update({ where: { id: lineId }, data })
  }
}
