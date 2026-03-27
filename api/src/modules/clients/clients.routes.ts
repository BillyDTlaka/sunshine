import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ClientService } from './clients.service'
import { authenticate } from '../../shared/middleware/auth'

const clientSchema = z.object({
  name: z.string().min(1),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    province: z.string().optional(),
    postal: z.string().optional(),
    country: z.string().default('South Africa'),
  }),
  deliveryAddress: z.object({
    street: z.string(),
    city: z.string(),
    province: z.string().optional(),
    postal: z.string().optional(),
    country: z.string().default('South Africa'),
  }).optional(),
  creditTerms: z.number().default(30),
  accountManagerId: z.string().uuid().optional(),
  notes: z.string().optional(),
})

const clientRoutes: FastifyPluginAsync = async (app) => {
  const service = new ClientService(app.prisma)

  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const { page = '1', limit = '20', search, status } = request.query as any
    return service.findAll({ page: parseInt(page), limit: parseInt(limit), search, status })
  })

  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const body = clientSchema.parse(request.body)
    const client = await service.create(body)
    return reply.status(201).send(client)
  })

  app.get('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.findById(id)
  })

  app.patch('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    const body = clientSchema.partial().parse(request.body)
    return service.update(id, body)
  })

  app.get('/:id/contacts', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string }
    return service.findContacts(id)
  })

  app.post('/:id/contacts', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      role: z.string().optional(),
      isPrimary: z.boolean().default(false),
    }).parse(request.body)
    const contact = await service.createContact(id, body)
    return reply.status(201).send(contact)
  })
}

export default clientRoutes
