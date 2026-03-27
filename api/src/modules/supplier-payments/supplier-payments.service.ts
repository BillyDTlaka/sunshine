import { PrismaClient } from '@prisma/client'

export class SupplierPaymentService {
  constructor(private prisma: PrismaClient) {}

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
