import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export class SupplierQuoteService {
  constructor(private prisma: PrismaClient) {}

  async findByRfq(rfqId: string) {
    return this.prisma.supplierQuote.findMany({
      where: { rfqId },
      include: { supplier: true, lines: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  async create(rfqId: string, data: any) {
    const { lines, ...quoteData } = data
    const quote = await this.prisma.supplierQuote.create({
      data: {
        ...quoteData,
        rfqId,
        status: 'RECEIVED',
        quoteDate: quoteData.quoteDate ? new Date(quoteData.quoteDate) : new Date(),
        validUntil: quoteData.validUntil ? new Date(quoteData.validUntil) : undefined,
        lines: lines?.length ? { create: lines } : undefined,
      },
      include: { lines: true },
    })

    const totalCost = lines?.reduce((sum: number, l: any) => sum + l.totalCost, 0) ?? 0
    return this.prisma.supplierQuote.update({
      where: { id: quote.id },
      data: { totalCost },
      include: { supplier: true, lines: true },
    })
  }

  async compare(rfqId: string) {
    const quotes = await this.findByRfq(rfqId)
    return quotes.map(q => ({
      supplierId: q.supplierId,
      supplierQuoteId: q.id,
      totalCost: q.totalCost,
      leadTimeDays: q.leadTimeDays,
      paymentTerms: q.paymentTerms,
      validUntil: q.validUntil,
      lineCount: q.lines.length,
    }))
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.supplierQuote.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('SupplierQuote')
    return this.prisma.supplierQuote.update({ where: { id }, data })
  }
}
