import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ProjectService } from './projects.service'
import { authenticate } from '../../shared/middleware/auth'

const lineItemSchema = z.object({
  description: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string().min(1),
  notes: z.string().optional(),
})

const projectSchema = z.object({
  title: z.string().min(1),
  requestReference: z.string().optional(),
  programId: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  campus: z.string().optional(),
  department: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  deadline: z.string().datetime().optional(),
  ownerId: z.string().uuid().optional(),
  labourRequired: z.boolean().optional(),
  labourScope: z.string().optional(),
  scopeOfWork: z.string().optional(),
  notes: z.string().optional(),
  estimatedRevenue: z.number().optional(),
  estimatedMaterial: z.number().optional(),
  estimatedLabour: z.number().optional(),
  markupPct: z.number().optional(),
  plannedGrossMargin: z.number().optional(),
  actualCost: z.number().optional(),
  actualMargin: z.number().optional(),
  lineItems: z.array(lineItemSchema).optional(),
})

const projectRoutes: FastifyPluginAsync = async (app) => {
  const service = new ProjectService(app.prisma)

  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const { page = '1', limit = '20', status, clientId, ownerId, programId, search, priority } = request.query as any
    return service.findAll({ page: parseInt(page), limit: parseInt(limit), status, clientId, ownerId, programId, search, priority })
  })

  app.get('/kanban', { preHandler: [authenticate] }, async () => service.getKanban())

  app.get('/stats', { preHandler: [authenticate] }, async () => service.getStats())

  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const body = projectSchema.parse(request.body)
    const user = (request as any).user
    return reply.status(201).send(await service.create(body, user.userId))
  })

  app.get('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.findById(id)
  })

  app.patch('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    const body = projectSchema.partial().parse(request.body)
    return service.update(id, body)
  })

  app.patch('/:id/status', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    const { status } = z.object({ status: z.string() }).parse(request.body)
    return service.transitionStatus(id, status)
  })

  // ─── Line Items ───────────────────────────────────────────────────────────
  app.post('/:id/line-items', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = lineItemSchema.parse(request.body)
    return reply.status(201).send(await service.addLineItem(id, body))
  })

  app.patch('/:id/line-items/:lineId', { preHandler: [authenticate] }, async (request) => {
    const { lineId } = request.params as { id: string; lineId: string }
    const body = lineItemSchema.partial().parse(request.body)
    return service.updateLineItem(lineId, body)
  })

  app.delete('/:id/line-items/:lineId', { preHandler: [authenticate] }, async (request, reply) => {
    const { lineId } = request.params as { id: string; lineId: string }
    await service.deleteLineItem(lineId)
    return reply.status(204).send()
  })

  app.post('/parse-rfq', { preHandler: [authenticate] }, async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'BAD_REQUEST', message: 'No file uploaded' })
    const buffer = await data.toBuffer()
    const mimeType = data.mimetype
    const result = await service.parseRfqDocument(buffer, mimeType)
    return result
  })
}

export default projectRoutes
