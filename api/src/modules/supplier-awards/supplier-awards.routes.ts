import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { SupplierAwardService } from './supplier-awards.service'
import { authenticate } from '../../shared/middleware/auth'

const supplierAwardRoutes: FastifyPluginAsync = async (app) => {
  const service = new SupplierAwardService(app.prisma)

  app.post('/:rfqId/supplier-awards', { preHandler: [authenticate] }, async (request, reply) => {
    const { rfqId } = request.params as { rfqId: string }
    const body = z.object({
      supplierQuoteId: z.string().uuid(),
      supplierId: z.string().uuid(),
      rationale: z.string().optional(),
    }).parse(request.body)
    const user = (request as any).user
    return reply.status(201).send(await service.create(rfqId, body, user.userId))
  })

  app.get('/:rfqId/supplier-awards', { preHandler: [authenticate] }, async (request) => {
    const { rfqId } = request.params as { rfqId: string }
    return service.findByRfq(rfqId)
  })
}

export default supplierAwardRoutes
