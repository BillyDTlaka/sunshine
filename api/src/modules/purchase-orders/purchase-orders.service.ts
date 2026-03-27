import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export class PurchaseOrderService {
  constructor(private prisma: PrismaClient) {}

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
