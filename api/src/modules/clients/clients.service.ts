import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export class ClientService {
  constructor(private prisma: PrismaClient) {}

  async findAll({ page = 1, limit = 20, search, status }: { page?: number; limit?: number; search?: string; status?: string }) {
    const where: any = {}
    if (search) where.name = { contains: search, mode: 'insensitive' }
    if (status) where.status = status

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: { accountManager: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { rfqs: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findById(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        contacts: true,
        accountManager: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { rfqs: true, clientInvoices: true } },
      },
    })
    if (!client) throw new NotFoundError('Client')
    return client
  }

  async create(data: any) {
    return this.prisma.client.create({ data })
  }

  async update(id: string, data: any) {
    await this.findById(id)
    return this.prisma.client.update({ where: { id }, data })
  }

  async findContacts(clientId: string) {
    await this.findById(clientId)
    return this.prisma.contact.findMany({ where: { clientId }, orderBy: { isPrimary: 'desc' } })
  }

  async createContact(clientId: string, data: any) {
    await this.findById(clientId)
    return this.prisma.contact.create({ data: { ...data, clientId } })
  }
}
