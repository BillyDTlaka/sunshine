import { PrismaClient } from '@prisma/client'

export class SupplierAwardService {
  constructor(private prisma: PrismaClient) {}

  async findAll({ page = 1, limit = 20, search }: any = {}) {
    const where: any = {}
    if (search) where.OR = [
      { rfq: { referenceNumber: { contains: search, mode: 'insensitive' } } },
      { supplier: { name: { contains: search, mode: 'insensitive' } } },
    ]
    const [data, total] = await Promise.all([
      this.prisma.supplierAward.findMany({
        where,
        include: {
          rfq: { include: { client: { select: { id: true, name: true } } } },
          supplier: { select: { id: true, name: true } },
          supplierQuote: { select: { id: true, totalCost: true } },
          awardedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { awardedAt: 'desc' },
      }),
      this.prisma.supplierAward.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

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
