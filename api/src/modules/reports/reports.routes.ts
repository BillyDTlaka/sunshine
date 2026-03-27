import { FastifyPluginAsync } from 'fastify'
import { ReportService } from './reports.service'
import { authenticate } from '../../shared/middleware/auth'

const reportRoutes: FastifyPluginAsync = async (app) => {
  const service = new ReportService(app.prisma)

  app.get('/pipeline', { preHandler: [authenticate] }, async (request) => {
    const { from, to, accountManagerId } = request.query as any
    return service.pipeline({ from, to, accountManagerId })
  })

  app.get('/margins', { preHandler: [authenticate] }, async (request) => {
    const { from, to, clientId } = request.query as any
    return service.margins({ from, to, clientId })
  })

  app.get('/win-loss', { preHandler: [authenticate] }, async (request) => {
    const { from, to } = request.query as any
    return service.winLoss({ from, to })
  })

  app.get('/supplier-payments', { preHandler: [authenticate] }, async (request) => {
    const { supplierId, from, to } = request.query as any
    return service.supplierPayments({ supplierId, from, to })
  })

  app.get('/delivery-cycle', { preHandler: [authenticate] }, async () => service.deliveryCycle())

  app.get('/receivables', { preHandler: [authenticate] }, async () => service.receivables())
}

export default reportRoutes
