import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export class ClientInvoiceService {
  constructor(private prisma: PrismaClient) {}

  async findAll({ status, clientId }: { status?: string; clientId?: string } = {}) {
    const where: any = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    return this.prisma.clientInvoice.findMany({
      where,
      include: { client: true, rfq: true, purchaseOrder: true },
      orderBy: { invoiceDate: 'desc' },
    })
  }

  async create(rfqId: string, data: any) {
    const count = await this.prisma.clientInvoice.count()
    const year = new Date().getFullYear()
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`

    const invoice = await this.prisma.clientInvoice.create({
      data: {
        rfqId,
        clientId: data.clientId,
        clientQuoteId: data.clientQuoteId,
        purchaseOrderId: data.purchaseOrderId,
        deliveryNoteId: data.deliveryNoteId,
        invoiceNumber,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
        dueDate: new Date(data.dueDate),
        totalAmount: data.totalAmount,
        notes: data.notes,
        status: 'DRAFT',
      },
    })
    await this.prisma.rfq.update({ where: { id: rfqId }, data: { status: 'INVOICE_DRAFT' } })
    return invoice
  }

  async markIssued(id: string) {
    const invoice = await this.prisma.clientInvoice.findUnique({ where: { id } })
    if (!invoice) throw new NotFoundError('ClientInvoice')
    const updated = await this.prisma.clientInvoice.update({ where: { id }, data: { status: 'ISSUED' } })
    await this.prisma.rfq.update({ where: { id: invoice.rfqId }, data: { status: 'INVOICE_ISSUED' } })
    return updated
  }

  async markPaid(id: string, paidAmount: number) {
    const invoice = await this.prisma.clientInvoice.findUnique({ where: { id } })
    if (!invoice) throw new NotFoundError('ClientInvoice')
    const updated = await this.prisma.clientInvoice.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date(), paidAmount },
    })
    await this.prisma.rfq.update({ where: { id: invoice.rfqId }, data: { status: 'INVOICE_PAID' } })
    return updated
  }
}
