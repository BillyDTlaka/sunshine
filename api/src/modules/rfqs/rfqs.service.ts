import { PrismaClient, RfqStatus } from '@prisma/client'
import { NotFoundError, InvalidTransitionError } from '../../shared/errors/AppError'

const RFQ_TRANSITIONS: Record<string, string[]> = {
  RFQ_DRAFT: ['RFQ_OPEN', 'CANCELLED'],
  RFQ_OPEN: ['SUPPLIER_QUOTES_REQUESTED', 'CANCELLED'],
  SUPPLIER_QUOTES_REQUESTED: ['SUPPLIER_QUOTES_RECEIVED', 'CANCELLED'],
  SUPPLIER_QUOTES_RECEIVED: ['PRICING_IN_PROGRESS', 'CANCELLED'],
  PRICING_IN_PROGRESS: ['INTERNAL_REVIEW_PENDING', 'CANCELLED'],
  INTERNAL_REVIEW_PENDING: ['APPROVED_FOR_CLIENT', 'PRICING_IN_PROGRESS'],
  APPROVED_FOR_CLIENT: ['SENT_TO_CLIENT'],
  SENT_TO_CLIENT: ['CLIENT_ACCEPTED', 'LOST'],
  CLIENT_ACCEPTED: ['PO_RECEIVED'],
  PO_RECEIVED: ['SUPPLIER_SELECTION_PENDING'],
  SUPPLIER_SELECTION_PENDING: ['SUPPLIER_SELECTED'],
  SUPPLIER_SELECTED: ['PRO_FORMA_REQUESTED'],
  PRO_FORMA_REQUESTED: ['PRO_FORMA_RECEIVED'],
  PRO_FORMA_RECEIVED: ['REQUISITION_PENDING'],
  REQUISITION_PENDING: ['REQUISITION_APPROVED', 'REQUISITION_PENDING'],
  REQUISITION_APPROVED: ['PAYMENT_PENDING'],
  PAYMENT_PENDING: ['PAID_TO_SUPPLIER'],
  PAID_TO_SUPPLIER: ['DELIVERY_SCHEDULED'],
  DELIVERY_SCHEDULED: ['IN_TRANSIT', 'DELIVERED'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: ['DELIVERY_CONFIRMED'],
  DELIVERY_CONFIRMED: ['INVOICE_DRAFT'],
  INVOICE_DRAFT: ['INVOICE_ISSUED'],
  INVOICE_ISSUED: ['INVOICE_PAID'],
  INVOICE_PAID: ['CLOSED'],
  LOST: [],
  CANCELLED: [],
  CLOSED: [],
}

let referenceCounter = 1

export class RfqService {
  constructor(private prisma: PrismaClient) {}

  async findAll({ page = 1, limit = 20, status, clientId, accountManagerId, search }: any) {
    const where: any = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (accountManagerId) where.accountManagerId = accountManagerId
    if (search) where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]

    const [data, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          accountManager: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { supplierQuotes: true, clientQuotes: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rfq.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findById(id: string) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        client: true,
        contact: true,
        accountManager: { select: { id: true, firstName: true, lastName: true } },
        lineItems: { orderBy: { lineNumber: 'asc' } },
        supplierQuotes: { include: { supplier: true, lines: true } },
        clientQuotes: {
          include: {
            lines: true,
            preparedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        purchaseOrders: true,
        supplierAwards: { include: { supplier: true, supplierQuote: { include: { lines: true } } } },
        proFormaInvoices: { include: { supplier: true } },
        requisitions: {
          include: {
            supplier: true,
            requestedBy: { select: { id: true, firstName: true, lastName: true } },
            approvals: { include: { approver: { select: { id: true, firstName: true, lastName: true } } } },
            supplierPayments: true,
          },
        },
        deliveries: { include: { deliveryNote: true } },
        clientInvoices: true,
      },
    })
    if (!rfq) throw new NotFoundError('RFQ')
    return rfq
  }

  async findActive({ page = 1, limit = 20, status, search }: any = {}) {
    const ACTIVE_STATUSES = [
      'PO_RECEIVED', 'SUPPLIER_SELECTION_PENDING', 'SUPPLIER_SELECTED',
      'PRO_FORMA_REQUESTED', 'PRO_FORMA_RECEIVED', 'REQUISITION_PENDING',
      'REQUISITION_APPROVED', 'PAYMENT_PENDING', 'PAID_TO_SUPPLIER',
      'DELIVERY_SCHEDULED', 'IN_TRANSIT', 'DELIVERED',
    ]
    const where: any = { status: { in: status ? [status] : ACTIVE_STATUSES } }
    if (search) where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
    ]
    const [data, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          accountManager: { select: { id: true, firstName: true, lastName: true } },
          supplierAwards: { include: { supplier: { select: { id: true, name: true } } }, take: 1 },
          proFormaInvoices: { orderBy: { requestedAt: 'desc' }, take: 1 },
          requisitions: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { supplierQuotes: true, clientQuotes: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.rfq.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async create(data: any) {
    const type = data.type ?? 'RFQ'
    const count = await this.prisma.rfq.count()
    const year = new Date().getFullYear()
    const prefix = type === 'RFP' ? 'RFP' : 'RFQ'
    const referenceNumber = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`

    return this.prisma.rfq.create({
      data: {
        referenceNumber,
        type,
        clientId: data.clientId,
        contactId: data.contactId,
        accountManagerId: data.accountManagerId,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        description: data.description,
        lineItems: data.lineItems?.length
          ? { create: data.lineItems }
          : undefined,
      },
      include: { lineItems: true },
    })
  }

  async transitionStatus(id: string, newStatus: RfqStatus, userId: string) {
    const rfq = await this.findById(id)
    const allowed = RFQ_TRANSITIONS[rfq.status] ?? []
    if (!allowed.includes(newStatus)) {
      throw new InvalidTransitionError(rfq.status, newStatus)
    }

    const updated = await this.prisma.rfq.update({
      where: { id },
      data: { status: newStatus },
    })

    await this.prisma.auditLog.create({
      data: {
        userId,
        entityType: 'RFQ',
        entityId: id,
        action: 'STATUS_CHANGE',
        before: { status: rfq.status },
        after: { status: newStatus },
      },
    })

    return updated
  }

  async addLineItem(rfqId: string, data: any) {
    await this.findById(rfqId)
    return this.prisma.rfqLineItem.create({ data: { ...data, rfqId } })
  }

  async deleteLineItem(lineId: string) {
    return this.prisma.rfqLineItem.delete({ where: { id: lineId } })
  }
}
