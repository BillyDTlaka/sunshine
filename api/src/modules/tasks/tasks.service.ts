import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export class TaskService {
  constructor(private prisma: PrismaClient) {}

  async findAll({ projectId, assigneeId, status, priority, myTasks, userId }: any) {
    const where: any = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (priority) where.priority = priority
    if (myTasks && userId) where.assigneeId = userId
    else if (assigneeId) where.assigneeId = assigneeId

    return this.prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, projectId: true, title: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    })
  }

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, projectId: true, title: true, client: { select: { name: true } } } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })
    if (!task) throw new NotFoundError('Task')
    return task
  }

  async create(data: any, userId: string) {
    return this.prisma.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        priority: data.priority ?? 'MEDIUM',
        status: 'TODO',
        createdById: userId,
      },
      include: {
        project: { select: { id: true, projectId: true, title: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  }

  async update(id: string, data: any) {
    await this.findById(id)
    return this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        priority: data.priority,
        status: data.status,
      },
      include: {
        project: { select: { id: true, projectId: true, title: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  }

  async delete(id: string) {
    await this.findById(id)
    await this.prisma.task.delete({ where: { id } })
  }
}
