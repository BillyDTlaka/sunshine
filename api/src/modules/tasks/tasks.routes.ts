import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { TaskService } from './tasks.service'
import { authenticate } from '../../shared/middleware/auth'

const taskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
})

const taskRoutes: FastifyPluginAsync = async (app) => {
  const service = new TaskService(app.prisma)

  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const { projectId, assigneeId, status, priority, myTasks } = request.query as any
    const user = (request as any).user
    return service.findAll({ projectId, assigneeId, status, priority, myTasks: myTasks === 'true', userId: user.userId })
  })

  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const body = taskSchema.parse(request.body)
    const user = (request as any).user
    return reply.status(201).send(await service.create(body, user.userId))
  })

  app.get('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.findById(id)
  })

  app.patch('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    const body = taskSchema.partial().extend({
      status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED']).optional(),
    }).parse(request.body)
    return service.update(id, body)
  })

  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await service.delete(id)
    return reply.status(204).send()
  })
}

export default taskRoutes
