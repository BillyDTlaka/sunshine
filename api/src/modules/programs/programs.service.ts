import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export class ProgramService {
  constructor(private prisma: PrismaClient) {}

  async findAll({ clientId, search }: any = {}) {
    const where: any = {}
    if (clientId) where.clientId = clientId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    return this.prisma.program.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { projects: true } },
      },
      orderBy: [{ client: { name: 'asc' } }, { name: 'asc' }],
    })
  }

  async findById(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        projects: {
          include: {
            owner: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { tasks: true, rfqs: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!program) throw new NotFoundError('Program')
    return program
  }

  async create(data: any, userId: string) {
    return this.prisma.program.create({
      data: {
        name: data.name,
        clientId: data.clientId,
        contracted: data.contracted ?? false,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        notes: data.notes,
        createdById: userId,
      },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { projects: true } },
      },
    })
  }

  async update(id: string, data: any) {
    await this.findById(id)
    return this.prisma.program.update({
      where: { id },
      data: {
        name: data.name,
        clientId: data.clientId,
        contracted: data.contracted,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        notes: data.notes,
      },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { projects: true } },
      },
    })
  }
}
