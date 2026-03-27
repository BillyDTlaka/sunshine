import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ClientInvoiceService } from './client-invoices.service'
import { authenticate, authorize } from '../../shared/middleware/auth'

const clientInvoiceRoutes: FastifyPluginAsync = async (app) => {
  const service = new ClientInvoiceService(app.prisma)

  app.get('/client-invoices', { preHandler: [authenticate] }, async (request) => {
    const { status, clientId } = request.query as any
    return service.findAll({ status, clientId })
  })

  app.post('/:rfqId/client-invoices', { preHandler: [authenticate, authorize('FINANCE', 'ADMIN', 'SALES')] }, async (request, reply) => {
    const { rfqId } = request.params as { rfqId: string }
    const body = z.object({
      clientId: z.string().uuid(),
      clientQuoteId: z.string().uuid(),
      purchaseOrderId: z.string().uuid(),
      deliveryNoteId: z.string().uuid().optional(),
      invoiceDate: z.string().datetime().optional(),
      dueDate: z.string().datetime(),
      totalAmount: z.number().positive(),
      notes: z.string().optional(),
    }).parse(request.body)
    return reply.status(201).send(await service.create(rfqId, body))
  })

  app.patch('/:rfqId/client-invoices/:id/mark-issued', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { rfqId: string; id: string }
    return service.markIssued(id)
  })

  app.patch('/:rfqId/client-invoices/:id/mark-paid', { preHandler: [authenticate, authorize('FINANCE', 'ADMIN')] }, async (request) => {
    const { id } = request.params as { rfqId: string; id: string }
    const { paidAmount } = z.object({ paidAmount: z.number().positive() }).parse(request.body)
    return service.markPaid(id, paidAmount)
  })
}

export default clientInvoiceRoutes
