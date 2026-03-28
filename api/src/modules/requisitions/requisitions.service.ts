import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export class RequisitionService {
  constructor(private prisma: PrismaClient) {}

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
