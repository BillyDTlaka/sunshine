import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export class RequisitionService {
  constructor(private prisma: PrismaClient) {}

  async findAll({ page = 1, limit = 20, status, search }: any = {}) {
    const where: any = {}
    if (status) where.status = status
    if (search) where.OR = [
      { rfq: { referenceNumber: { contains: search, mode: 'insensitive' } } },
      { supplier: { name: { contains: search, mode: 'insensitive' } } },
    ]
    const [data, total] = await Promise.all([
      this.prisma.requisition.findMany({
        where,
        include: {
          rfq: { include: { client: { select: { id: true, name: true } } } },
          supplier: { select: { id: true, name: true } },
          requestedBy: { select: { id: true, firstName: true, lastName: true } },
          approvals: { select: { decision: true, level: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.requisition.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async create(rfqId: string, data: any, userId: string) {
    return this.prisma.requisition.create({
      data: {
        rfqId,
        proFormaInvoiceId: data.proFormaInvoiceId,
        supplierId: data.supplierId,
        requestedById: userId,
        amount: data.amount,
        description: data.description,
        status: 'DRAFT',
      },
    })
  }

  async submit(id: string) {
    const req = await this.findById(id)
    const updated = await this.prisma.requisition.update({
      where: { id },
      data: {
        status: 'PENDING',
        approvals: {
          create: {
            entityType: 'REQUISITION',
            approverId: req.requestedById,
            decision: 'PENDING',
            level: 1,
          },
        },
      },
    })
    await this.prisma.rfq.update({ where: { id: req.rfqId }, data: { status: 'REQUISITION_PENDING' } })
    return updated
  }

  async findById(id: string) {
    const req = await this.prisma.requisition.findUnique({
      where: { id },
      include: { supplier: true, proFormaInvoice: true, approvals: true, supplierPayments: true },
    })
    if (!req) throw new NotFoundError('Requisition')
    return req
  }
}
