import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ProgramService } from './programs.service'
import { authenticate } from '../../shared/middleware/auth'

const programSchema = z.object({
  name: z.string().min(1),
  clientId: z.string().uuid(),
  contracted: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

const programRoutes: FastifyPluginAsync = async (app) => {
  const service = new ProgramService(app.prisma)

  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const { clientId, search } = request.query as any
    return service.findAll({ clientId, search })
  })

  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const body = programSchema.parse(request.body)
    const user = (request as any).user
    return reply.status(201).send(await service.create(body, user.userId))
  })

  app.get('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.findById(id)
  })

  app.patch('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    const body = programSchema.partial().parse(request.body)
    return service.update(id, body)
  })
}

export default programRoutes
