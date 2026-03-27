import { PrismaClient } from '@prisma/client'
import { NotFoundError, AppError } from '../../shared/errors/AppError'

export class DeliveryService {
  constructor(private prisma: PrismaClient) {}

  async findByRfq(rfqId: string) {
    return this.prisma.delivery.findMany({
      where: { rfqId },
      include: { lines: true, deliveryNote: true, responsibleUser: { select: { id: true, firstName: true, lastName: true } } },
    })
  }

  async create(rfqId: string, data: any) {
    const { lines, ...deliveryData } = data
    return this.prisma.delivery.create({
      data: {
        rfqId,
        ...deliveryData,
        scheduledDate: deliveryData.scheduledDate ? new Date(deliveryData.scheduledDate) : undefined,
        lines: lines?.length ? { create: lines } : undefined,
      },
      include: { lines: true },
    })
  }

  async updateStatus(id: string, status: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } })
    if (!delivery) throw new NotFoundError('Delivery')
    const update: any = { status }
    if (status === 'DELIVERED') update.actualDate = new Date()
    return this.prisma.delivery.update({ where: { id }, data: update })
  }

  async createDeliveryNote(deliveryId: string, rfqId: string, data: any) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } })
    if (!delivery) throw new NotFoundError('Delivery')
    if (delivery.status !== 'DELIVERED') throw new AppError('Delivery must be in DELIVERED status before capturing a delivery note', 422)

    const note = await this.prisma.deliveryNote.create({
      data: { deliveryId, ...data },
    })

    await this.prisma.delivery.update({ where: { id: deliveryId }, data: { status: 'CONFIRMED' } })
    await this.prisma.rfq.update({ where: { id: rfqId }, data: { status: 'DELIVERY_CONFIRMED' } })

    return note
  }
}
