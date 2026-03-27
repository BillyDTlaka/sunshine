import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export class SupplierService {
  constructor(private prisma: PrismaClient) {}

  async findAll({ search, status }: { search?: string; status?: string } = {}) {
    const where: any = {}
    if (search) where.name = { contains: search, mode: 'insensitive' }
    if (status) where.status = status
    return this.prisma.supplier.findMany({ where, orderBy: { name: 'asc' } })
  }

  async findById(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } })
    if (!supplier) throw new NotFoundError('Supplier')
    return supplier
  }

  async create(data: any) {
    return this.prisma.supplier.create({ data })
  }

  async update(id: string, data: any) {
    await this.findById(id)
    return this.prisma.supplier.update({ where: { id }, data })
  }
}
