import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { AiPromptService } from './ai-prompts.service'
import { authenticate, authorize } from '../../shared/middleware/auth'

const aiPromptRoutes: FastifyPluginAsync = async (app) => {
  const service = new AiPromptService(app.prisma)

  // Seed defaults on startup
  await service.ensureDefaults()

  app.get('/', { preHandler: [authenticate] }, async () => service.findAll())

  app.patch('/:id', { preHandler: [authenticate, authorize('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string }
    const body = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      prompt: z.string().min(10).optional(),
    }).parse(request.body)
    const user = (request as any).user
    return service.update(id, body, user.userId)
  })
}

export default aiPromptRoutes
