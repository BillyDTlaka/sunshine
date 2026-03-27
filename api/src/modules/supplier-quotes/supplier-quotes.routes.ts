import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { SupplierQuoteService } from './supplier-quotes.service'
import { authenticate } from '../../shared/middleware/auth'

const lineSchema = z.object({
  description: z.string(),
  quantity: z.number().positive(),
  unitCost: z.number().min(0),
  totalCost: z.number().min(0),
  rfqLineItemId: z.string().uuid().optional(),
  notes: z.string().optional(),
})

const quoteSchema = z.object({
  supplierId: z.string().uuid(),
  quoteDate: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  paymentTerms: z.string().optional(),
  leadTimeDays: z.number().optional(),
  currency: z.string().default('ZAR'),
  notes: z.string().optional(),
  lines: z.array(lineSchema).default([]),
})

const supplierQuoteRoutes: FastifyPluginAsync = async (app) => {
  const service = new SupplierQuoteService(app.prisma)

  app.get('/:rfqId/supplier-quotes', { preHandler: [authenticate] }, async (request) => {
    const { rfqId } = request.params as { rfqId: string }
    return service.findByRfq(rfqId)
  })

  app.post('/:rfqId/supplier-quotes', { preHandler: [authenticate] }, async (request, reply) => {
    const { rfqId } = request.params as { rfqId: string }
    const body = quoteSchema.parse(request.body)
    return reply.status(201).send(await service.create(rfqId, body))
  })

  app.get('/:rfqId/supplier-quotes/compare', { preHandler: [authenticate] }, async (request) => {
    const { rfqId } = request.params as { rfqId: string }
    return service.compare(rfqId)
  })

  app.patch('/supplier-quotes/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.update(id, quoteSchema.partial().parse(request.body))
  })
}

export default supplierQuoteRoutes
