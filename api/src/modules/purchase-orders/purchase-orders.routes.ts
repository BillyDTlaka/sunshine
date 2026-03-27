import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { PurchaseOrderService } from './purchase-orders.service'
import { authenticate } from '../../shared/middleware/auth'

const purchaseOrderRoutes: FastifyPluginAsync = async (app) => {
  const service = new PurchaseOrderService(app.prisma)

  app.post('/:rfqId/purchase-orders', { preHandler: [authenticate] }, async (request, reply) => {
    const { rfqId } = request.params as { rfqId: string }
    const body = z.object({
      clientQuoteId: z.string().uuid(),
      clientId: z.string().uuid(),
      poNumber: z.string().min(1),
      poDate: z.string().datetime(),
      poAmount: z.number().positive(),
    }).parse(request.body)
    const user = (request as any).user
    return reply.status(201).send(await service.create(rfqId, body, user.userId))
  })

  app.get('/purchase-orders/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.findById(id)
  })
}

export default purchaseOrderRoutes
