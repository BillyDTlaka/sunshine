import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import * as XLSX from 'xlsx'
import { MasterDataService } from './master-data.service'
import { authenticate } from '../../shared/middleware/auth'

const ENTITIES = ['customers', 'suppliers', 'materials', 'services', 'employees', 'departments'] as const

const customerSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1),
  type: z.string().optional(),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  billingAddress: z.record(z.any()).default({}),
  deliveryAddress: z.record(z.any()).optional(),
  creditTerms: z.number().default(30),
  notes: z.string().optional(),
})

const supplierSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1),
  type: z.string().optional(),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.record(z.any()).optional(),
  paymentTerms: z.string().optional(),
  leadTimeDays: z.number().int().optional(),
  preferredSupplier: z.boolean().default(false),
  notes: z.string().optional(),
})

const materialSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  unitOfMeasure: z.string().default('Each'),
  defaultCost: z.number().optional(),
  defaultSellingPrice: z.number().optional(),
  defaultMarkupPercent: z.number().min(0).max(999).optional(),
  preferredSupplierId: z.string().uuid().optional(),
  taxCode: z.string().optional(),
  notes: z.string().optional(),
})

const serviceSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  pricingType: z.enum(['FIXED', 'TIME_AND_MATERIAL', 'UNIT_RATE']).default('FIXED'),
  unitOfMeasure: z.string().default('Hour'),
  defaultCostRate: z.number().optional(),
  defaultBillRate: z.number().optional(),
  standardHours: z.number().optional(),
  taxCode: z.string().optional(),
  notes: z.string().optional(),
})

const employeeSchema = z.object({
  employeeNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  jobTitle: z.string().optional(),
  managerId: z.string().uuid().optional(),
  employmentType: z.enum(['PERMANENT', 'CONTRACT', 'PART_TIME', 'INTERN']).optional(),
  costRate: z.number().optional(),
  billableRate: z.number().optional(),
  notes: z.string().optional(),
})

const departmentSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  managerId: z.string().uuid().optional(),
  notes: z.string().optional(),
})

const schemas: Record<string, z.ZodObject<any>> = {
  customers: customerSchema,
  suppliers: supplierSchema,
  materials: materialSchema,
  services: serviceSchema,
  employees: employeeSchema,
  departments: departmentSchema,
}

const masterDataRoutes: FastifyPluginAsync = async (app) => {
  const svc = new MasterDataService(app.prisma)

  // ─── Generic list/get/create/update/status per entity ───────────────────

  for (const entity of ENTITIES) {
    // List
    app.get(`/${entity}`, { preHandler: [authenticate] }, async (request) => {
      const { page = '1', limit = '20', search, status } = request.query as any
      const params = { page: parseInt(page), limit: parseInt(limit), search, status }
      switch (entity) {
        case 'customers': return svc.listCustomers(params)
        case 'suppliers': return svc.listSuppliers(params)
        case 'materials': return svc.listMaterials(params)
        case 'services':  return svc.listServices(params)
        case 'employees': return svc.listEmployees(params)
        case 'departments': return svc.listDepartments(params)
      }
    })

    // Get by id
    app.get(`/${entity}/:id`, { preHandler: [authenticate] }, async (request) => {
      const { id } = request.params as { id: string }
      switch (entity) {
        case 'customers': return svc.getCustomer(id)
        case 'suppliers': return svc.getSupplier(id)
        case 'materials': return svc.getMaterial(id)
        case 'services':  return svc.getService(id)
        case 'employees': return svc.getEmployee(id)
        case 'departments': return svc.getDepartment(id)
      }
    })

    // Create
    app.post(`/${entity}`, { preHandler: [authenticate] }, async (request, reply) => {
      const body = schemas[entity].parse(request.body)
      let result
      switch (entity) {
        case 'customers': result = await svc.createCustomer(body); break
        case 'suppliers': result = await svc.createSupplier(body); break
        case 'materials': result = await svc.createMaterial(body); break
        case 'services':  result = await svc.createService(body); break
        case 'employees': result = await svc.createEmployee(body); break
        case 'departments': result = await svc.createDepartment(body); break
      }
      return reply.status(201).send(result)
    })

    // Update
    app.patch(`/${entity}/:id`, { preHandler: [authenticate] }, async (request) => {
      const { id } = request.params as { id: string }
      const body = schemas[entity].partial().parse(request.body)
      switch (entity) {
        case 'customers': return svc.updateCustomer(id, body)
        case 'suppliers': return svc.updateSupplier(id, body)
        case 'materials': return svc.updateMaterial(id, body)
        case 'services':  return svc.updateService(id, body)
        case 'employees': return svc.updateEmployee(id, body)
        case 'departments': return svc.updateDepartment(id, body)
      }
    })

    // Set status
    app.patch(`/${entity}/:id/status`, { preHandler: [authenticate] }, async (request) => {
      const { id } = request.params as { id: string }
      const { status } = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) }).parse(request.body)
      switch (entity) {
        case 'customers': return svc.setCustomerStatus(id, status)
        case 'suppliers': return svc.setSupplierStatus(id, status)
        case 'materials': return svc.setMaterialStatus(id, status)
        case 'services':  return svc.setServiceStatus(id, status)
        case 'employees': return svc.setEmployeeStatus(id, status)
        case 'departments': return svc.setDepartmentStatus(id, status)
      }
    })

    // Import (CSV / XLSX)
    app.post(`/${entity}/import`, { preHandler: [authenticate] }, async (request, reply) => {
      const data = await request.file()
      if (!data) return reply.status(400).send({ error: 'No file uploaded' })

      const buffer = await data.toBuffer()
      const filename = data.filename.toLowerCase()

      let rows: Record<string, string>[]
      try {
        if (filename.endsWith('.csv')) {
          const wb = XLSX.read(buffer, { type: 'buffer', raw: false })
          const ws = wb.Sheets[wb.SheetNames[0]]
          rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, string>[]
        } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
          const wb = XLSX.read(buffer, { type: 'buffer' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, string>[]
        } else {
          return reply.status(400).send({ error: 'Only .csv, .xlsx, and .xls files are supported' })
        }
      } catch {
        return reply.status(400).send({ error: 'Failed to parse file' })
      }

      if (rows.length === 0) return reply.status(400).send({ error: 'File is empty or has no data rows' })

      const result = await svc.importRecords(entity, rows)
      return reply.send(result)
    })
  }
}

export default masterDataRoutes
