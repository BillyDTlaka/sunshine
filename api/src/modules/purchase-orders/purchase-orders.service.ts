import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export class PurchaseOrderService {
  constructor(private prisma: PrismaClient) {}

  async findAll({ page = 1, limit = 20, search }: any = {}) {
    const where: any = {}
    if (search) where.OR = [
      { poNumber: { contains: search, mode: 'insensitive' } },
      { rfq: { referenceNumber: { contains: search, mode: 'insensitive' } } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
    ]

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          rfq: { select: { id: true, referenceNumber: true } },
          client: { select: { id: true, name: true } },
          clientQuote: { select: { id: true, versionNumber: true, totalSell: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async create(rfqId: string, data: any, userId: string) {
    const po = await this.prisma.purchaseOrder.create({
      data: {
        rfqId,
        clientQuoteId: data.clientQuoteId,
        clientId: data.clientId,
        poNumber: data.poNumber,
        poDate: new Date(data.poDate),
        poAmount: data.poAmount,
        receivedById: userId,
      },
    })
    await this.prisma.clientQuote.update({ where: { id: data.clientQuoteId }, data: { status: 'ACCEPTED' } })
    await this.prisma.rfq.update({ where: { id: rfqId }, data: { status: 'PO_RECEIVED' } })
    return po
  }

  async findById(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { client: true, clientQuote: true, rfq: true },
    })
    if (!po) throw new NotFoundError('PurchaseOrder')
    return po
  }
}
