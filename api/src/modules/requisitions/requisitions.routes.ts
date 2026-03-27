import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { RequisitionService } from './requisitions.service'
import { authenticate } from '../../shared/middleware/auth'

const requisitionRoutes: FastifyPluginAsync = async (app) => {
  const service = new RequisitionService(app.prisma)

  app.post('/:rfqId/requisitions', { preHandler: [authenticate] }, async (request, reply) => {
    const { rfqId } = request.params as { rfqId: string }
    const body = z.object({
      proFormaInvoiceId: z.string().uuid(),
      supplierId: z.string().uuid(),
      amount: z.number().positive(),
      description: z.string().optional(),
      approverId: z.string().uuid(),
    }).parse(request.body)
    const user = (request as any).user
    return reply.status(201).send(await service.create(rfqId, body, user.userId))
  })

  app.post('/requisitions/:id/submit', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.submit(id)
  })

  app.get('/requisitions/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.findById(id)
  })
}

export default requisitionRoutes
