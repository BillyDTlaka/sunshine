import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { config } from './config'
import prismaPlugin from './shared/plugins/prisma'
import { AppError } from './shared/errors/AppError'
import { ZodError } from 'zod'

// Modules
import authRoutes from './modules/auth/auth.routes'
import clientRoutes from './modules/clients/clients.routes'
import supplierRoutes from './modules/suppliers/suppliers.routes'
import rfqRoutes from './modules/rfqs/rfqs.routes'
import supplierQuoteRoutes from './modules/supplier-quotes/supplier-quotes.routes'
import clientQuoteRoutes from './modules/client-quotes/client-quotes.routes'
import markupRoutes from './modules/markup/markup.routes'
import approvalRoutes from './modules/approvals/approvals.routes'
import purchaseOrderRoutes from './modules/purchase-orders/purchase-orders.routes'
import supplierAwardRoutes from './modules/supplier-awards/supplier-awards.routes'
import proFormaRoutes from './modules/pro-formas/pro-formas.routes'
import requisitionRoutes from './modules/requisitions/requisitions.routes'
import supplierPaymentRoutes from './modules/supplier-payments/supplier-payments.routes'
import deliveryRoutes from './modules/deliveries/deliveries.routes'
import clientInvoiceRoutes from './modules/client-invoices/client-invoices.routes'
import dashboardRoutes from './modules/dashboard/dashboard.routes'
import reportRoutes from './modules/reports/reports.routes'
import masterDataRoutes from './modules/master-data/master-data.routes'
import salesRoutes from './modules/sales/sales.routes'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.nodeEnv === 'development' ? 'info' : 'warn',
      transport: config.nodeEnv === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  })

  // Plugins
  await app.register(cors, { origin: true })
  await app.register(jwt, { secret: config.jwtSecret })
  await app.register(prismaPlugin)
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // Routes
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(clientRoutes, { prefix: '/clients' })
  await app.register(supplierRoutes, { prefix: '/suppliers' })
  await app.register(rfqRoutes, { prefix: '/rfqs' })
  await app.register(supplierQuoteRoutes, { prefix: '/rfqs' })
  await app.register(clientQuoteRoutes, { prefix: '/rfqs' })
  await app.register(markupRoutes, { prefix: '/markup-rules' })
  await app.register(approvalRoutes, { prefix: '/approvals' })
  await app.register(purchaseOrderRoutes, { prefix: '/rfqs' })
  await app.register(supplierAwardRoutes, { prefix: '/rfqs' })
  await app.register(proFormaRoutes, { prefix: '/rfqs' })
  await app.register(requisitionRoutes, { prefix: '/rfqs' })
  await app.register(supplierPaymentRoutes, { prefix: '/requisitions' })
  await app.register(deliveryRoutes, { prefix: '/rfqs' })
  await app.register(clientInvoiceRoutes, { prefix: '/rfqs' })
  await app.register(dashboardRoutes, { prefix: '/dashboard' })
  await app.register(reportRoutes, { prefix: '/reports' })
  await app.register(masterDataRoutes, { prefix: '/master-data' })
  await app.register(salesRoutes, { prefix: '/sales' })

  // Global error handler
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code ?? error.name,
        message: error.message,
      })
    }

    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        issues: error.issues,
      })
    }

    app.log.error(error)
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    })
  })

  return app
}
