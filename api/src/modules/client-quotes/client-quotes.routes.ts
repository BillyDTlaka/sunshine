import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ClientQuoteService } from './client-quotes.service'
import { authenticate } from '../../shared/middleware/auth'

const quoteLineSchema = z.object({
  lineNumber: z.number(),
  description: z.string(),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'LICENCE', 'LABOUR_FIXED', 'LABOUR_TM', 'OTHER']),
  quantity: z.number().positive(),
  unit: z.string().default('Each'),
  unitCost: z.number().min(0).default(0),
  markupPct: z.number().min(0).default(0),
  labourType: z.enum(['FIXED', 'TIME_AND_MATERIAL']).optional(),
  labourRate: z.number().optional(),
  labourHoursEstimated: z.number().optional(),
  labourFixedFee: z.number().optional(),
  notes: z.string().optional(),
  rfqLineItemId: z.string().uuid().optional(),
  supplierQuoteLineId: z.string().uuid().optional(),
})

const clientQuoteRoutes: FastifyPluginAsync = async (app) => {
  const service = new ClientQuoteService(app.prisma)

  app.get('/:rfqId/client-quotes', { preHandler: [authenticate] }, async (request) => {
    const { rfqId } = request.params as { rfqId: string }
    return service.findByRfq(rfqId)
  })

  app.post('/:rfqId/client-quotes', { preHandler: [authenticate] }, async (request, reply) => {
    const { rfqId } = request.params as { rfqId: string }
    const body = z.object({
      defaultMarkupPct: z.number().default(0),
      validUntil: z.string().datetime().optional(),
      terms: z.string().optional(),
      notes: z.string().optional(),
      lines: z.array(quoteLineSchema).default([]),
    }).parse(request.body)
    const user = (request as any).user
    return reply.status(201).send(await service.create(rfqId, body, user.userId))
  })

  app.get('/client-quotes/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.findById(id)
  })

  app.post('/client-quotes/:id/submit-for-approval', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    const user = (request as any).user
    return service.submitForApproval(id, user.userId)
  })

  app.post('/client-quotes/:id/mark-sent', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    const { sentTo } = z.object({ sentTo: z.string().optional() }).parse(request.body)
    return service.markSent(id, sentTo)
  })

  app.patch('/client-quotes/:id/quote-lines/:lineId', { preHandler: [authenticate] }, async (request) => {
    const { lineId } = request.params as { id: string; lineId: string }
    return service.updateLine(lineId, quoteLineSchema.partial().parse(request.body))
  })
}

export default clientQuoteRoutes
