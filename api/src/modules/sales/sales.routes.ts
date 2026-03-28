import { FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../shared/middleware/auth'
import { ClientQuoteService } from '../client-quotes/client-quotes.service'
import { PurchaseOrderService } from '../purchase-orders/purchase-orders.service'

const salesRoutes: FastifyPluginAsync = async (app) => {
  const clientQuoteService = new ClientQuoteService(app.prisma)
  const purchaseOrderService = new PurchaseOrderService(app.prisma)

  // Global client quotes list
  app.get('/client-quotes', { preHandler: [authenticate] }, async (request) => {
    const { page = '1', limit = '20', status, search } = request.query as any
    return clientQuoteService.findAll({ page: parseInt(page), limit: parseInt(limit), status, search })
  })

  // Global purchase orders list
  app.get('/purchase-orders', { preHandler: [authenticate] }, async (request) => {
    const { page = '1', limit = '20', search } = request.query as any
    return purchaseOrderService.findAll({ page: parseInt(page), limit: parseInt(limit), search })
  })
}

export default salesRoutes
