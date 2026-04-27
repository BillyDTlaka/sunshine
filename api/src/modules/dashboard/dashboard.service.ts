import { PrismaClient } from '@prisma/client'

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  async getSummary() {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      newRequests,
      pendingApprovals,
      inExecution,
      lateProjects,
      monthRevenue,
      winCount,
      lostCount,
      openRfqs,
      invoicesOutstanding,
    ] = await Promise.all([
      this.prisma.project.count({ where: { status: 'NEW_REQUEST' } }),
      this.prisma.approval.count({ where: { decision: 'PENDING' } }),
      this.prisma.project.count({ where: { status: 'EXECUTING' } }),
      this.prisma.project.count({
        where: {
          deadline: { lt: now },
          status: { notIn: ['COMPLETED', 'CLOSED', 'LOST'] },
        },
      }),
      this.prisma.project.aggregate({
        where: {
          status: { in: ['WON', 'EXECUTING', 'COMPLETED', 'CLOSED'] },
          createdAt: { gte: startOfMonth },
        },
        _sum: { estimatedRevenue: true },
      }),
      this.prisma.project.count({ where: { status: { in: ['WON', 'EXECUTING', 'COMPLETED', 'CLOSED'] } } }),
      this.prisma.project.count({ where: { status: 'LOST' } }),
      this.prisma.rfq.count({ where: { status: { notIn: ['CLOSED', 'LOST', 'CANCELLED'] } } }),
      this.prisma.clientInvoice.count({ where: { status: { in: ['ISSUED', 'OVERDUE'] } } }),
    ])

    const totalDecided = winCount + lostCount
    const winRate = totalDecided > 0 ? Math.round((winCount / totalDecided) * 100) : 0

    return {
      newRequests,
      pendingApprovals,
      inExecution,
      lateProjects,
      monthRevenue: monthRevenue._sum.estimatedRevenue ?? 0,
      winRate,
      openRfqs,
      invoicesOutstanding,
    }
  }

  async getPipeline() {
    const projects = await this.prisma.project.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { status: { notIn: ['CLOSED'] } },
    })
    return projects.map(g => ({ status: g.status, count: g._count._all }))
  }

  async getAlerts(userId: string) {
    const now = new Date()

    const [myPendingTasks, pendingApprovals, lateProjects, overdueInvoices] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] },
          dueDate: { lt: now },
        },
        include: {
          project: { select: { id: true, projectId: true, title: true } },
        },
        take: 5,
      }),
      this.prisma.approval.findMany({
        where: { approverId: userId, decision: 'PENDING' },
        take: 5,
      }),
      this.prisma.project.findMany({
        where: {
          deadline: { lt: now },
          status: { notIn: ['COMPLETED', 'CLOSED', 'LOST'] },
        },
        include: { client: { select: { name: true } } },
        take: 5,
        orderBy: { deadline: 'asc' },
      }),
      this.prisma.clientInvoice.findMany({
        where: { status: 'ISSUED', dueDate: { lt: now } },
        include: { client: true },
        take: 5,
      }),
    ])

    return { myPendingTasks, pendingApprovals, lateProjects, overdueInvoices }
  }
}
