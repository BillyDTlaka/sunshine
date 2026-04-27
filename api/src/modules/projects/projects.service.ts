import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'
import { config } from '../../config'
import { NotFoundError, InvalidTransitionError } from '../../shared/errors/AppError'
import { AiPromptService } from '../ai-prompts/ai-prompts.service'

const PROJECT_TRANSITIONS: Record<string, string[]> = {
  NEW_REQUEST:    ['ESTIMATING', 'LOST'],
  ESTIMATING:     ['QUOTED', 'LOST'],
  QUOTED:         ['SUBMITTED', 'ESTIMATING', 'LOST'],
  SUBMITTED:      ['WON', 'LOST'],
  WON:            ['EXECUTING'],
  EXECUTING:      ['WAITING_CLIENT', 'COMPLETED'],
  WAITING_CLIENT: ['EXECUTING', 'COMPLETED'],
  COMPLETED:      ['CLOSED'],
  CLOSED:         [],
  LOST:           [],
}

export class ProjectService {
  private anthropic = new Anthropic({ apiKey: config.anthropic.apiKey })
  private aiPromptService: AiPromptService

  constructor(private prisma: PrismaClient) {
    this.aiPromptService = new AiPromptService(prisma)
  }

  private async generateProjectId(): Promise<string> {
    const year = new Date().getFullYear()
    const count = await this.prisma.project.count({
      where: { projectId: { startsWith: `LCK-${year}-` } },
    })
    const seq = String(count + 1).padStart(4, '0')
    return `LCK-${year}-${seq}`
  }

  async findAll({ page = 1, limit = 20, status, clientId, ownerId, programId, search, priority }: any) {
    const where: any = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (ownerId) where.ownerId = ownerId
    if (programId) where.programId = programId
    if (priority) where.priority = priority
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { projectId: { contains: search, mode: 'insensitive' } },
        { requestReference: { contains: search, mode: 'insensitive' } },
        { campus: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          owner: { select: { id: true, firstName: true, lastName: true } },
          program: { select: { id: true, name: true } },
          _count: { select: { tasks: true, rfqs: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        program: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true, role: true } },
        rfqs: {
          include: {
            _count: { select: { clientQuotes: true, supplierQuotes: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!project) throw new NotFoundError('Project')
    return project
  }

  async create(data: any, userId: string) {
    const projectId = await this.generateProjectId()

    return this.prisma.project.create({
      data: {
        projectId,
        title: data.title,
        requestReference: data.requestReference,
        programId: data.programId,
        clientId: data.clientId,
        campus: data.campus,
        department: data.department,
        priority: data.priority ?? 'MEDIUM',
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        ownerId: data.ownerId,
        status: 'NEW_REQUEST',
        scopeOfWork: data.scopeOfWork,
        deliverables: data.deliverables,
        notes: data.notes,
        estimatedRevenue: data.estimatedRevenue,
        estimatedMaterial: data.estimatedMaterial,
        estimatedLabour: data.estimatedLabour,
        markupPct: data.markupPct,
        plannedGrossMargin: data.plannedGrossMargin,
        createdById: userId,
      },
      include: {
        client: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  }

  async update(id: string, data: any) {
    await this.findById(id)

    return this.prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        requestReference: data.requestReference,
        campus: data.campus,
        department: data.department,
        priority: data.priority,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        ownerId: data.ownerId,
        scopeOfWork: data.scopeOfWork,
        deliverables: data.deliverables,
        notes: data.notes,
        estimatedRevenue: data.estimatedRevenue,
        estimatedMaterial: data.estimatedMaterial,
        estimatedLabour: data.estimatedLabour,
        markupPct: data.markupPct,
        plannedGrossMargin: data.plannedGrossMargin,
        actualCost: data.actualCost,
        actualMargin: data.actualMargin,
      },
      include: {
        client: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  }

  async transitionStatus(id: string, newStatus: string) {
    const project = await this.findById(id)
    const allowed = PROJECT_TRANSITIONS[project.status] ?? []
    if (!allowed.includes(newStatus)) {
      throw new InvalidTransitionError(project.status, newStatus)
    }

    return this.prisma.project.update({
      where: { id },
      data: { status: newStatus as any },
    })
  }

  async getKanban() {
    const projects = await this.prisma.project.findMany({
      where: { status: { notIn: ['CLOSED', 'LOST'] } },
      include: {
        client: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const columns = ['NEW_REQUEST', 'ESTIMATING', 'QUOTED', 'SUBMITTED', 'WON', 'EXECUTING', 'WAITING_CLIENT', 'COMPLETED']
    const board: Record<string, any[]> = {}
    for (const col of columns) board[col] = []
    for (const p of projects) {
      if (board[p.status]) board[p.status].push(p)
    }
    return board
  }

  async parseRfqDocument(buffer: Buffer, mimeType: string) {
    const promptRecord = await this.aiPromptService.findByKey('rfq_parse')
    const promptText = promptRecord.prompt

    let content: Anthropic.MessageParam['content']

    if (mimeType === 'application/pdf') {
      content = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: buffer.toString('base64'),
          },
        } as any,
        { type: 'text', text: promptText },
      ]
    } else {
      // Plain text or other formats — read as UTF-8
      content = [{ type: 'text', text: `${buffer.toString('utf-8')}\n\n${promptText}` }]
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI returned no valid JSON')
    return JSON.parse(jsonMatch[0])
  }

  async getStats() {
    const [byStatus, overdue, totalRevenue] = await Promise.all([
      this.prisma.project.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.project.count({
        where: {
          deadline: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'CLOSED', 'LOST'] },
        },
      }),
      this.prisma.project.aggregate({
        where: { status: { in: ['WON', 'EXECUTING', 'COMPLETED', 'CLOSED'] } },
        _sum: { estimatedRevenue: true },
      }),
    ])

    return {
      byStatus: byStatus.map(g => ({ status: g.status, count: g._count._all })),
      overdue,
      totalRevenue: totalRevenue._sum.estimatedRevenue ?? 0,
    }
  }
}
