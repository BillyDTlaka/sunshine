import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { DeliveryService } from './deliveries.service'
import { authenticate } from '../../shared/middleware/auth'

const deliveryRoutes: FastifyPluginAsync = async (app) => {
  const service = new DeliveryService(app.prisma)

  app.get('/:rfqId/deliveries', { preHandler: [authenticate] }, async (request) => {
    const { rfqId } = request.params as { rfqId: string }
    return service.findByRfq(rfqId)
  })

  app.post('/:rfqId/deliveries', { preHandler: [authenticate] }, async (request, reply) => {
    const { rfqId } = request.params as { rfqId: string }
    const body = z.object({
      method: z.enum(['COURIER', 'OWN_DELIVERY', 'REMOTE', 'COLLECTION']).default('OWN_DELIVERY'),
      scheduledDate: z.string().datetime().optional(),
      responsibleUserId: z.string().uuid().optional(),
      isPartial: z.boolean().default(false),
      notes: z.string().optional(),
      lines: z.array(z.object({
        quoteLineId: z.string().uuid(),
        description: z.string(),
        quantityDelivered: z.number().positive(),
      })).default([]),
    }).parse(request.body)
    return reply.status(201).send(await service.create(rfqId, body))
  })

  app.patch('/:rfqId/deliveries/:id/status', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { rfqId: string; id: string }
    const { status } = z.object({ status: z.enum(['SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CONFIRMED', 'PARTIAL']) }).parse(request.body)
    return service.updateStatus(id, status)
  })

  app.post('/:rfqId/deliveries/:id/delivery-note', { preHandler: [authenticate] }, async (request, reply) => {
    const { id, rfqId } = request.params as { rfqId: string; id: string }
    const body = z.object({
      confirmedByName: z.string().min(1),
      confirmedByContact: z.string().optional(),
      notes: z.string().optional(),
    }).parse(request.body)
    return reply.status(201).send(await service.createDeliveryNote(id, rfqId, body))
  })
}

export default deliveryRoutes
