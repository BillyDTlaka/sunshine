import { PrismaClient } from '@prisma/client'

export class NotifyService {
  constructor(private prisma: PrismaClient) {}

  async send(userId: string, message: string, entityType: string, entityId: string) {
    return this.prisma.notification.create({
      data: { userId, message, entityType, entityId, read: false },
    })
  }

  async markRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })
  }

  async getUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
    })
  }
}
