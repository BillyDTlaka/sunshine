import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { SupplierPaymentService } from './supplier-payments.service'
import { authenticate, authorize } from '../../shared/middleware/auth'

const supplierPaymentRoutes: FastifyPluginAsync = async (app) => {
  const service = new SupplierPaymentService(app.prisma)

  app.post('/:reqId/payments', { preHandler: [authenticate, authorize('FINANCE', 'ADMIN')] }, async (request, reply) => {
    const { reqId } = request.params as { reqId: string }
    const body = z.object({
      supplierId: z.string().uuid(),
      amount: z.number().positive(),
      paymentDate: z.string().datetime(),
      paymentMethod: z.enum(['EFT', 'CREDIT_CARD', 'CASH', 'OTHER']).default('EFT'),
      reference: z.string().optional(),
      notes: z.string().optional(),
    }).parse(request.body)
    return reply.status(201).send(await service.create(reqId, body))
  })

  app.get('/:reqId/payments', { preHandler: [authenticate] }, async (request) => {
    const { reqId } = request.params as { reqId: string }
    return service.findByRequisition(reqId)
  })
}

export default supplierPaymentRoutes
