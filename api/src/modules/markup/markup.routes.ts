import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticate, authorize } from '../../shared/middleware/auth'

const markupRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [authenticate] }, async () => {
    return app.prisma.markupRule.findMany({ orderBy: { effectiveFrom: 'desc' } })
  })

  app.post('/', { preHandler: [authenticate, authorize('ADMIN')] }, async (request, reply) => {
    const body = z.object({
      category: z.enum(['HARDWARE', 'SOFTWARE', 'LICENCE', 'OTHER', 'ALL']).default('ALL'),
      defaultMarkupPct: z.number().min(0).max(100),
    }).parse(request.body)
    const user = (request as any).user
    return reply.status(201).send(await app.prisma.markupRule.create({ data: { ...body, createdById: user.userId } }))
  })

  app.patch('/:id', { preHandler: [authenticate, authorize('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string }
    const body = z.object({ defaultMarkupPct: z.number().min(0).max(100) }).parse(request.body)
    return app.prisma.markupRule.update({ where: { id }, data: body })
  })
}

export default markupRoutes
