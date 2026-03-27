import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ProFormaService } from './pro-formas.service'
import { authenticate } from '../../shared/middleware/auth'

const proFormaRoutes: FastifyPluginAsync = async (app) => {
  const service = new ProFormaService(app.prisma)

  app.post('/:rfqId/pro-formas', { preHandler: [authenticate] }, async (request, reply) => {
    const { rfqId } = request.params as { rfqId: string }
    const body = z.object({
      supplierId: z.string().uuid(),
      supplierAwardId: z.string().uuid(),
      amount: z.number().optional(),
      currency: z.string().default('ZAR'),
    }).parse(request.body)
    return reply.status(201).send(await service.create(rfqId, body))
  })

  app.patch('/pro-formas/:id/mark-received', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    const body = z.object({ amount: z.number().positive() }).parse(request.body)
    return service.markReceived(id, body.amount)
  })

  app.get('/pro-formas/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.findById(id)
  })
}

export default proFormaRoutes
