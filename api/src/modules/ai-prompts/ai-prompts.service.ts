import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '../../shared/errors/AppError'

export const DEFAULT_PROMPTS = [
  {
    key: 'rfq_parse',
    name: 'RFQ Document Parser',
    description: 'Used to extract structured project information from uploaded RFQ documents.',
    prompt: `You are an expert at extracting structured information from RFQ (Request for Quotation) documents for an IT services company called LCK.

Analyse the provided document carefully and extract the following fields, returning ONLY a valid JSON object with no additional text, markdown, or explanation:

{
  "title": "concise project title describing what is being requested (required)",
  "requestReference": "RFQ or tender reference number if present, null if not found",
  "campus": "site, campus, building, or location of delivery/installation, null if not specified",
  "department": "requesting department, faculty, or division, null if not specified",
  "deadline": "submission or delivery deadline in YYYY-MM-DD format, null if not specified",
  "priority": "estimated urgency based on deadline and wording — one of: LOW, MEDIUM, HIGH, URGENT",
  "scopeOfWork": "clear and complete description of all work, supply, or services required",
  "deliverables": "specific items, services, or outcomes the client expects to receive",
  "notes": "important terms, conditions, special requirements, evaluation criteria, or anything LCK should know"
}

Use null for any field that cannot be determined from the document. Be accurate and factual — do not invent information not present in the document.`,
  },
]

export class AiPromptService {
  constructor(private prisma: PrismaClient) {}

  async ensureDefaults() {
    for (const d of DEFAULT_PROMPTS) {
      await this.prisma.aiPrompt.upsert({
        where: { key: d.key },
        update: {},
        create: d,
      })
    }
  }

  async findAll() {
    return this.prisma.aiPrompt.findMany({ orderBy: { name: 'asc' } })
  }

  async findByKey(key: string) {
    const prompt = await this.prisma.aiPrompt.findUnique({ where: { key } })
    if (!prompt) throw new NotFoundError(`AI Prompt '${key}'`)
    return prompt
  }

  async update(id: string, data: { name?: string; description?: string; prompt?: string }, userId: string) {
    const existing = await this.prisma.aiPrompt.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('AI Prompt')
    return this.prisma.aiPrompt.update({
      where: { id },
      data: { ...data, updatedById: userId },
    })
  }
}
