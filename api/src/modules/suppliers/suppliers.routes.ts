import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { SupplierService } from './suppliers.service'
import { authenticate } from '../../shared/middleware/auth'

const supplierSchema = z.object({
  name: z.string().min(1),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
  preferredContact: z.string().optional(),
  notes: z.string().optional(),
})

const supplierRoutes: FastifyPluginAsync = async (app) => {
  const service = new SupplierService(app.prisma)

  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const { search, status } = request.query as any
    return service.findAll({ search, status })
  })

  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const body = supplierSchema.parse(request.body)
    return reply.status(201).send(await service.create(body))
  })

  app.get('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.findById(id)
  })

  app.patch('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.update(id, supplierSchema.partial().parse(request.body))
  })
}

export default supplierRoutes
