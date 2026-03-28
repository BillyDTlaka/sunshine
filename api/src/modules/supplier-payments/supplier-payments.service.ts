import { PrismaClient } from '@prisma/client'

export class SupplierPaymentService {
  constructor(private prisma: PrismaClient) {}

  async findAll({ page = 1, limit = 20, search, fromDate, toDate }: any = {}) {
    const where: any = {}
    if (fromDate || toDate) {
      where.paymentDate = {}
      if (fromDate) where.paymentDate.gte = new Date(fromDate)
      if (toDate) where.paymentDate.lte = new Date(toDate)
    }
    if (search) where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { requisition: { rfq: { referenceNumber: { contains: search, mode: 'insensitive' } } } },
      { supplier: { name: { contains: search, mode: 'insensitive' } } },
    ]
    const [data, total] = await Promise.all([
      this.prisma.supplierPayment.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          requisition: {
            include: { rfq: { include: { client: { select: { id: true, name: true } } } } },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.supplierPayment.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async create(requisitionId: string, data: any) {
    const req = await this.prisma.requisition.findUnique({ where: { id: requisitionId } })
    const payment = await this.prisma.supplierPayment.create({
      data: {
        requisitionId,
        supplierId: data.supplierId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        notes: data.notes,
      },
    })
    if (req) {
      await this.prisma.rfq.update({ where: { id: req.rfqId }, data: { status: 'PAID_TO_SUPPLIER' } })
    }
    return payment
  }

  async findByRequisition(requisitionId: string) {
    return this.prisma.supplierPayment.findMany({ where: { requisitionId }, orderBy: { paymentDate: 'desc' } })
  }
}
