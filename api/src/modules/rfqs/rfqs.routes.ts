import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { RfqService } from './rfqs.service'
import { authenticate } from '../../shared/middleware/auth'

const lineItemSchema = z.object({
  lineNumber: z.number(),
  description: z.string(),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'LICENCE', 'LABOUR_FIXED', 'LABOUR_TM', 'OTHER']),
  quantity: z.number().positive(),
  unit: z.string().default('Each'),
  notes: z.string().optional(),
})

const rfqSchema = z.object({
  clientId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  accountManagerId: z.string().uuid().optional(),
  type: z.enum(['RFQ', 'RFP']).default('RFQ'),
  deadline: z.string().datetime().optional(),
  description: z.string().optional(),
  lineItems: z.array(lineItemSchema).default([]),
})

const rfqRoutes: FastifyPluginAsync = async (app) => {
  const service = new RfqService(app.prisma)

  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const { page = '1', limit = '20', status, clientId, accountManagerId, search } = request.query as any
    return service.findAll({ page: parseInt(page), limit: parseInt(limit), status, clientId, accountManagerId, search })
  })

  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const body = rfqSchema.parse(request.body)
    return reply.status(201).send(await service.create(body))
  })

  app.get('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.findById(id)
  })

  app.patch('/:id/status', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    const { status } = z.object({ status: z.string() }).parse(request.body)
    const user = (request as any).user
    return service.transitionStatus(id, status as any, user.userId)
  })

  app.post('/:id/line-items', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = lineItemSchema.parse(request.body)
    return reply.status(201).send(await service.addLineItem(id, body))
  })

  app.delete('/:id/line-items/:lineId', { preHandler: [authenticate] }, async (request, reply) => {
    const { lineId } = request.params as { id: string; lineId: string }
    await service.deleteLineItem(lineId)
    return reply.status(204).send()
  })
}

export default rfqRoutes
