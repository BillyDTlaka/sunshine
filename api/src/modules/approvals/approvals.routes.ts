import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ApprovalService } from './approvals.service'
import { authenticate, authorize } from '../../shared/middleware/auth'

const approvalRoutes: FastifyPluginAsync = async (app) => {
  const service = new ApprovalService(app.prisma)

  app.get('/pending', { preHandler: [authenticate] }, async (request) => {
    const user = (request as any).user
    return service.findPending(user.userId)
  })

  app.post('/:id/approve', { preHandler: [authenticate, authorize('APPROVER', 'SENIOR_APPROVER', 'ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string }
    const { comments } = z.object({ comments: z.string().optional() }).parse(request.body)
    const user = (request as any).user
    return service.approve(id, user.userId, comments)
  })

  app.post('/:id/reject', { preHandler: [authenticate, authorize('APPROVER', 'SENIOR_APPROVER', 'ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string }
    const { comments } = z.object({ comments: z.string().min(1, 'Rejection reason is required') }).parse(request.body)
    const user = (request as any).user
    return service.reject(id, user.userId, comments)
  })
}

export default approvalRoutes
