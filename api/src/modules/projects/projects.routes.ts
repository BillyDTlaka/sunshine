import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ProjectService } from './projects.service'
import { authenticate } from '../../shared/middleware/auth'

const projectSchema = z.object({
  title: z.string().min(1),
  requestReference: z.string().optional(),
  clientId: z.string().uuid(),
  campus: z.string().optional(),
  department: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  deadline: z.string().datetime().optional(),
  ownerId: z.string().uuid().optional(),
  scopeOfWork: z.string().optional(),
  deliverables: z.string().optional(),
  notes: z.string().optional(),
  estimatedRevenue: z.number().optional(),
  estimatedMaterial: z.number().optional(),
  estimatedLabour: z.number().optional(),
  markupPct: z.number().optional(),
  plannedGrossMargin: z.number().optional(),
  actualCost: z.number().optional(),
  actualMargin: z.number().optional(),
})

const projectRoutes: FastifyPluginAsync = async (app) => {
  const service = new ProjectService(app.prisma)

  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const { page = '1', limit = '20', status, clientId, ownerId, search, priority } = request.query as any
    return service.findAll({ page: parseInt(page), limit: parseInt(limit), status, clientId, ownerId, search, priority })
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
}

export default projectRoutes
