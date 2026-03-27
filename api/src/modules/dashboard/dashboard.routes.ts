import { FastifyPluginAsync } from 'fastify'
import { DashboardService } from './dashboard.service'
import { authenticate } from '../../shared/middleware/auth'

const dashboardRoutes: FastifyPluginAsync = async (app) => {
  const service = new DashboardService(app.prisma)

  app.get('/summary', { preHandler: [authenticate] }, async () => service.getSummary())
  app.get('/pipeline', { preHandler: [authenticate] }, async () => service.getPipeline())
  app.get('/alerts', { preHandler: [authenticate] }, async (request) => {
    const user = (request as any).user
    return service.getAlerts(user.userId)
  })
}

export default dashboardRoutes
