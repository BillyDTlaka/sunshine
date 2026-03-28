import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export class ProFormaService {
  constructor(private prisma: PrismaClient) {}

  async findAll({ page = 1, limit = 20, status, search }: any = {}) {
    const where: any = {}
    if (status) where.status = status
    if (search) where.OR = [
      { rfq: { referenceNumber: { contains: search, mode: 'insensitive' } } },
      { supplier: { name: { contains: search, mode: 'insensitive' } } },
    ]
    const [data, total] = await Promise.all([
      this.prisma.proFormaInvoice.findMany({
        where,
        include: {
          rfq: { include: { client: { select: { id: true, name: true } } } },
          supplier: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { requestedAt: 'desc' },
      }),
      this.prisma.proFormaInvoice.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async create(rfqId: string, data: any) {
    const pf = await this.prisma.proFormaInvoice.create({
      data: { rfqId, supplierId: data.supplierId, supplierAwardId: data.supplierAwardId, amount: data.amount, currency: data.currency, status: 'REQUESTED' },
    })
    await this.prisma.rfq.update({ where: { id: rfqId }, data: { status: 'PRO_FORMA_REQUESTED' } })
    return pf
  }

  async markReceived(id: string, amount: number) {
    const pf = await this.prisma.proFormaInvoice.findUnique({ where: { id } })
    if (!pf) throw new NotFoundError('ProFormaInvoice')
    const updated = await this.prisma.proFormaInvoice.update({ where: { id }, data: { status: 'RECEIVED', receivedAt: new Date(), amount } })
    await this.prisma.rfq.update({ where: { id: pf.rfqId }, data: { status: 'PRO_FORMA_RECEIVED' } })
    return updated
  }

  async findById(id: string) {
    const pf = await this.prisma.proFormaInvoice.findUnique({ where: { id }, include: { supplier: true, supplierAward: true } })
    if (!pf) throw new NotFoundError('ProFormaInvoice')
    return pf
  }
}
