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
  "scopeOfWork": "overall narrative description of the work or project context, null if not present",
  "notes": "important terms, conditions, special requirements, evaluation criteria, or anything LCK should know",
  "labourRequired": true or false — whether installation, configuration, or any labour/services are required,
  "labourScope": "description of the installation or services work required, null if labourRequired is false",
  "lineItems": [
    {
      "description": "item description",
      "qty": numeric quantity,
      "unit": "unit of measure — use one of: Each, m, m², m³, kg, Roll, Box, Set, Lot, Hour, Day — default to Each if unclear",
      "notes": "any item-specific notes or specifications, null if none"
    }
  ]
}

The lineItems array must contain every distinct item or material requested. If line items cannot be clearly identified, return an empty array [].
Use null for any scalar field that cannot be determined. Be accurate and factual — do not invent information not present in the document.`,
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
