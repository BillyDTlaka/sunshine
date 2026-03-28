import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticate, authorize } from '../../shared/middleware/auth'
import { RfqService } from '../rfqs/rfqs.service'
import { SupplierAwardService } from '../supplier-awards/supplier-awards.service'
import { ProFormaService } from '../pro-formas/pro-formas.service'
import { RequisitionService } from '../requisitions/requisitions.service'
import { SupplierPaymentService } from '../supplier-payments/supplier-payments.service'

const projectAdminRoutes: FastifyPluginAsync = async (app) => {
  const rfqService = new RfqService(app.prisma)
  const awardService = new SupplierAwardService(app.prisma)
  const proFormaService = new ProFormaService(app.prisma)
  const reqService = new RequisitionService(app.prisma)
  const paymentService = new SupplierPaymentService(app.prisma)

  // Active projects (RFQs in execution phase)
  app.get('/active-projects', { preHandler: [authenticate] }, async (request) => {
    const { page = '1', limit = '20', status, search } = request.query as any
    return rfqService.findActive({ page: parseInt(page), limit: parseInt(limit), status, search })
  })

  // Supplier awards
  app.get('/supplier-awards', { preHandler: [authenticate] }, async (request) => {
    const { page = '1', limit = '20', search } = request.query as any
    return awardService.findAll({ page: parseInt(page), limit: parseInt(limit), search })
  })

  // Pro formas
  app.get('/pro-formas', { preHandler: [authenticate] }, async (request) => {
    const { page = '1', limit = '20', status, search } = request.query as any
    return proFormaService.findAll({ page: parseInt(page), limit: parseInt(limit), status, search })
  })

  app.patch('/pro-formas/:id/mark-received', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    const { amount } = z.object({ amount: z.number().positive() }).parse(request.body)
    return proFormaService.markReceived(id, amount)
  })

  // Requisitions
  app.get('/requisitions', { preHandler: [authenticate] }, async (request) => {
    const { page = '1', limit = '20', status, search } = request.query as any
    return reqService.findAll({ page: parseInt(page), limit: parseInt(limit), status, search })
  })

  app.post('/requisitions/:id/submit', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return reqService.submit(id)
  })

  // Payments
  app.get('/payments', { preHandler: [authenticate] }, async (request) => {
    const { page = '1', limit = '20', search, fromDate, toDate } = request.query as any
    return paymentService.findAll({ page: parseInt(page), limit: parseInt(limit), search, fromDate, toDate })
  })

  app.post('/requisitions/:reqId/payments', { preHandler: [authenticate, authorize('FINANCE', 'ADMIN')] }, async (request, reply) => {
    const { reqId } = request.params as { reqId: string }
    const body = z.object({
      supplierId: z.string().uuid(),
      amount: z.number().positive(),
      paymentDate: z.string().datetime(),
      paymentMethod: z.enum(['EFT', 'CREDIT_CARD', 'CASH', 'OTHER']).default('EFT'),
      reference: z.string().optional(),
      notes: z.string().optional(),
    }).parse(request.body)
    return reply.status(201).send(await paymentService.create(reqId, body))
  })
}

export default projectAdminRoutes
