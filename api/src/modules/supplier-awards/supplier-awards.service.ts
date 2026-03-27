import { PrismaClient } from '@prisma/client'

export class SupplierAwardService {
  constructor(private prisma: PrismaClient) {}

  async create(rfqId: string, data: any, userId: string) {
    const award = await this.prisma.supplierAward.create({
      data: { rfqId, supplierQuoteId: data.supplierQuoteId, supplierId: data.supplierId, awardedById: userId, rationale: data.rationale },
      include: { supplier: true, supplierQuote: true },
    })
    await this.prisma.rfq.update({ where: { id: rfqId }, data: { status: 'SUPPLIER_SELECTED' } })
    return award
  }

  async findByRfq(rfqId: string) {
    return this.prisma.supplierAward.findMany({
      where: { rfqId },
      include: { supplier: true, supplierQuote: { include: { lines: true } } },
    })
  }
}
