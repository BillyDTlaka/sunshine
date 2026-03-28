import { PrismaClient } from '@prisma/client'
import { NotFoundError, AppError } from '../../shared/errors/AppError'

type ListParams = { page?: number; limit?: number; search?: string; status?: string }

export class MasterDataService {
  constructor(private prisma: PrismaClient) {}

  // ─── Customers (Client model) ─────────────────────────────────────────────

  async listCustomers({ page = 1, limit = 20, search, status }: ListParams) {
    const where: any = {}
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ]
    if (status) where.status = status
    const [data, total] = await Promise.all([
      this.prisma.client.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.client.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getCustomer(id: string) {
    const rec = await this.prisma.client.findUnique({ where: { id } })
    if (!rec) throw new NotFoundError('Customer')
    return rec
  }

  async createCustomer(data: any) {
    if (data.code) {
      const exists = await this.prisma.client.findUnique({ where: { code: data.code } })
      if (exists) throw new AppError(`Customer code ${data.code} already exists`, 409)
    }
    return this.prisma.client.create({ data: { ...data, billingAddress: data.billingAddress ?? {} } })
  }

  async updateCustomer(id: string, data: any) {
    await this.getCustomer(id)
    if (data.code) {
      const exists = await this.prisma.client.findFirst({ where: { code: data.code, NOT: { id } } })
      if (exists) throw new AppError(`Customer code ${data.code} already exists`, 409)
    }
    return this.prisma.client.update({ where: { id }, data })
  }

  async setCustomerStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    await this.getCustomer(id)
    return this.prisma.client.update({ where: { id }, data: { status } })
  }

  // ─── Suppliers ────────────────────────────────────────────────────────────

  async listSuppliers({ page = 1, limit = 20, search, status }: ListParams) {
    const where: any = {}
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ]
    if (status) where.status = status
    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.supplier.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getSupplier(id: string) {
    const rec = await this.prisma.supplier.findUnique({ where: { id } })
    if (!rec) throw new NotFoundError('Supplier')
    return rec
  }

  async createSupplier(data: any) {
    if (data.code) {
      const exists = await this.prisma.supplier.findUnique({ where: { code: data.code } })
      if (exists) throw new AppError(`Supplier code ${data.code} already exists`, 409)
    }
    return this.prisma.supplier.create({ data })
  }

  async updateSupplier(id: string, data: any) {
    await this.getSupplier(id)
    if (data.code) {
      const exists = await this.prisma.supplier.findFirst({ where: { code: data.code, NOT: { id } } })
      if (exists) throw new AppError(`Supplier code ${data.code} already exists`, 409)
    }
    return this.prisma.supplier.update({ where: { id }, data })
  }

  async setSupplierStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    await this.getSupplier(id)
    return this.prisma.supplier.update({ where: { id }, data: { status } })
  }

  // ─── Materials ────────────────────────────────────────────────────────────

  async listMaterials({ page = 1, limit = 20, search, status }: ListParams) {
    const where: any = {}
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ]
    if (status) where.status = status
    const [data, total] = await Promise.all([
      this.prisma.material.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' },
        include: { preferredSupplier: { select: { id: true, name: true } } },
      }),
      this.prisma.material.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getMaterial(id: string) {
    const rec = await this.prisma.material.findUnique({
      where: { id },
      include: { preferredSupplier: { select: { id: true, name: true } } },
    })
    if (!rec) throw new NotFoundError('Material')
    return rec
  }

  async createMaterial(data: any) {
    const exists = await this.prisma.material.findUnique({ where: { code: data.code } })
    if (exists) throw new AppError(`Material code ${data.code} already exists`, 409)
    return this.prisma.material.create({ data })
  }

  async updateMaterial(id: string, data: any) {
    await this.getMaterial(id)
    if (data.code) {
      const exists = await this.prisma.material.findFirst({ where: { code: data.code, NOT: { id } } })
      if (exists) throw new AppError(`Material code ${data.code} already exists`, 409)
    }
    return this.prisma.material.update({ where: { id }, data })
  }

  async setMaterialStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    await this.getMaterial(id)
    return this.prisma.material.update({ where: { id }, data: { status } })
  }

  // ─── Services ─────────────────────────────────────────────────────────────

  async listServices({ page = 1, limit = 20, search, status }: ListParams) {
    const where: any = {}
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ]
    if (status) where.status = status
    const [data, total] = await Promise.all([
      this.prisma.serviceItem.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.serviceItem.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getService(id: string) {
    const rec = await this.prisma.serviceItem.findUnique({ where: { id } })
    if (!rec) throw new NotFoundError('Service')
    return rec
  }

  async createService(data: any) {
    const exists = await this.prisma.serviceItem.findUnique({ where: { code: data.code } })
    if (exists) throw new AppError(`Service code ${data.code} already exists`, 409)
    return this.prisma.serviceItem.create({ data })
  }

  async updateService(id: string, data: any) {
    await this.getService(id)
    if (data.code) {
      const exists = await this.prisma.serviceItem.findFirst({ where: { code: data.code, NOT: { id } } })
      if (exists) throw new AppError(`Service code ${data.code} already exists`, 409)
    }
    return this.prisma.serviceItem.update({ where: { id }, data })
  }

  async setServiceStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    await this.getService(id)
    return this.prisma.serviceItem.update({ where: { id }, data: { status } })
  }

  // ─── Employees ────────────────────────────────────────────────────────────

  async listEmployees({ page = 1, limit = 20, search, status }: ListParams) {
    const where: any = {}
    if (search) where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { employeeNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
    if (status) where.status = status
    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { lastName: 'asc' },
        include: {
          department: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.employee.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getEmployee(id: string) {
    const rec = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    })
    if (!rec) throw new NotFoundError('Employee')
    return rec
  }

  async createEmployee(data: any) {
    const byNumber = await this.prisma.employee.findUnique({ where: { employeeNumber: data.employeeNumber } })
    if (byNumber) throw new AppError(`Employee number ${data.employeeNumber} already exists`, 409)
    const byEmail = await this.prisma.employee.findUnique({ where: { email: data.email } })
    if (byEmail) throw new AppError(`Email ${data.email} already exists`, 409)
    return this.prisma.employee.create({ data })
  }

  async updateEmployee(id: string, data: any) {
    await this.getEmployee(id)
    if (data.employeeNumber) {
      const exists = await this.prisma.employee.findFirst({ where: { employeeNumber: data.employeeNumber, NOT: { id } } })
      if (exists) throw new AppError(`Employee number ${data.employeeNumber} already exists`, 409)
    }
    if (data.email) {
      const exists = await this.prisma.employee.findFirst({ where: { email: data.email, NOT: { id } } })
      if (exists) throw new AppError(`Email ${data.email} already exists`, 409)
    }
    return this.prisma.employee.update({ where: { id }, data })
  }

  async setEmployeeStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    await this.getEmployee(id)
    return this.prisma.employee.update({ where: { id }, data: { status } })
  }

  // ─── Departments ──────────────────────────────────────────────────────────

  async listDepartments({ page = 1, limit = 20, search, status }: ListParams) {
    const where: any = {}
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ]
    if (status) where.status = status
    const [data, total] = await Promise.all([
      this.prisma.department.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' },
        include: {
          manager: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { employees: true } },
        },
      }),
      this.prisma.department.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getDepartment(id: string) {
    const rec = await this.prisma.department.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        employees: { select: { id: true, firstName: true, lastName: true, jobTitle: true, status: true } },
      },
    })
    if (!rec) throw new NotFoundError('Department')
    return rec
  }

  async createDepartment(data: any) {
    const exists = await this.prisma.department.findUnique({ where: { code: data.code } })
    if (exists) throw new AppError(`Department code ${data.code} already exists`, 409)
    return this.prisma.department.create({ data })
  }

  async updateDepartment(id: string, data: any) {
    await this.getDepartment(id)
    if (data.code) {
      const exists = await this.prisma.department.findFirst({ where: { code: data.code, NOT: { id } } })
      if (exists) throw new AppError(`Department code ${data.code} already exists`, 409)
    }
    return this.prisma.department.update({ where: { id }, data })
  }

  async setDepartmentStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    await this.getDepartment(id)
    return this.prisma.department.update({ where: { id }, data: { status } })
  }

  // ─── Bulk Import ──────────────────────────────────────────────────────────

  // Column aliases: maps common human-readable headers → canonical field names
  private static readonly ALIASES: Record<string, string> = {
    // generic
    'code': 'code', 'name': 'name', 'description': 'description',
    'category': 'category', 'notes': 'notes', 'status': 'status',
    'type': 'type',
    // customers / suppliers
    'registration number': 'registrationNumber', 'registration no': 'registrationNumber', 'registrationnumber': 'registrationNumber',
    'reg number': 'registrationNumber', 'reg no': 'registrationNumber',
    'vat number': 'vatNumber', 'vat no': 'vatNumber', 'vatnumber': 'vatNumber',
    'credit terms': 'creditTerms', 'creditTerms': 'creditTerms',
    'contact email': 'contactEmail', 'contactemail': 'contactEmail', 'email': 'contactEmail',
    'contact phone': 'contactPhone', 'contactphone': 'contactPhone', 'phone': 'contactPhone',
    'payment terms': 'paymentTerms', 'paymentterms': 'paymentTerms',
    'lead time': 'leadTimeDays', 'lead time (days)': 'leadTimeDays', 'leadtimedays': 'leadTimeDays',
    'preferred': 'preferredSupplier', 'preferred supplier': 'preferredSupplier', 'preferredsupplier': 'preferredSupplier',
    // materials
    'unit': 'unitOfMeasure', 'unit of measure': 'unitOfMeasure', 'uom': 'unitOfMeasure', 'unitofmeasure': 'unitOfMeasure',
    'default cost': 'defaultCost', 'cost': 'defaultCost', 'defaultcost': 'defaultCost',
    'default selling price': 'defaultSellingPrice', 'sell price': 'defaultSellingPrice', 'selling price': 'defaultSellingPrice', 'defaultsellingprice': 'defaultSellingPrice',
    'markup %': 'defaultMarkupPercent', 'markup percent': 'defaultMarkupPercent', 'default markup %': 'defaultMarkupPercent', 'defaultmarkuppercent': 'defaultMarkupPercent',
    'tax code': 'taxCode', 'taxcode': 'taxCode',
    // services
    'pricing': 'pricingType', 'pricing type': 'pricingType', 'pricingtype': 'pricingType',
    'cost rate': 'defaultCostRate', 'default cost rate': 'defaultCostRate', 'defaultcostrate': 'defaultCostRate',
    'bill rate': 'defaultBillRate', 'bill rate (zar)': 'defaultBillRate', 'billable rate': 'defaultBillRate',
    'default bill rate': 'defaultBillRate', 'defaultbillrate': 'defaultBillRate',
    'standard hours': 'standardHours', 'standardhours': 'standardHours',
    // employees
    'employee number': 'employeeNumber', 'emp no': 'employeeNumber', 'employee no': 'employeeNumber', 'employeenumber': 'employeeNumber',
    'first name': 'firstName', 'firstname': 'firstName',
    'last name': 'lastName', 'lastname': 'lastName',
    'job title': 'jobTitle', 'jobtitle': 'jobTitle', 'title': 'jobTitle',
    'employment type': 'employmentType', 'employmenttype': 'employmentType',
    'billable rate': 'billableRate', 'billablerate': 'billableRate',
  }

  private normalizeRow(row: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(row)) {
      const norm = k.trim().toLowerCase()
      const canonical = MasterDataService.ALIASES[norm] ?? norm
      out[canonical] = typeof v === 'string' ? v.trim() : String(v ?? '')
    }
    return out
  }

  async importRecords(entity: string, rows: Record<string, string>[]) {
    const results = { created: 0, updated: 0, errors: [] as { row: number; message: string }[] }

    for (let i = 0; i < rows.length; i++) {
      const row = this.normalizeRow(rows[i])
      try {
        await this.upsertRow(entity, row)
        results.created++
      } catch (e: any) {
        results.errors.push({ row: i + 2, message: e.message })
      }
    }

    return results
  }

  private async upsertRow(entity: string, row: Record<string, string>) {
    switch (entity) {
      case 'customers': {
        const code = row.code?.trim()
        if (!code || !row.name) throw new Error('code and name are required')
        const data = {
          code, name: row.name.trim(),
          type: row.type || undefined,
          registrationNumber: row.registrationNumber || undefined,
          vatNumber: row.vatNumber || undefined,
          notes: row.notes || undefined,
          billingAddress: {},
        }
        await this.prisma.client.upsert({
          where: { code },
          create: data,
          update: { name: data.name, type: data.type, registrationNumber: data.registrationNumber, vatNumber: data.vatNumber, notes: data.notes },
        })
        break
      }
      case 'suppliers': {
        const code = row.code?.trim()
        if (!code || !row.name) throw new Error('code and name are required')
        const data = {
          code, name: row.name.trim(),
          type: row.type || undefined,
          contactEmail: row.contactEmail || undefined,
          contactPhone: row.contactPhone || undefined,
          paymentTerms: row.paymentTerms || undefined,
          leadTimeDays: row.leadTimeDays ? parseInt(row.leadTimeDays) : undefined,
          preferredSupplier: row.preferredSupplier === 'true' || row.preferredSupplier === 'yes',
          notes: row.notes || undefined,
        }
        await this.prisma.supplier.upsert({
          where: { code },
          create: data,
          update: data,
        })
        break
      }
      case 'materials': {
        const code = row.code?.trim()
        if (!code || !row.name) throw new Error('code and name are required')
        const data = {
          code, name: row.name.trim(),
          description: row.description || undefined,
          category: row.category || undefined,
          unitOfMeasure: row.unitOfMeasure || 'Each',
          defaultCost: row.defaultCost ? parseFloat(row.defaultCost) : undefined,
          defaultSellingPrice: row.defaultSellingPrice ? parseFloat(row.defaultSellingPrice) : undefined,
          defaultMarkupPercent: row.defaultMarkupPercent ? parseFloat(row.defaultMarkupPercent) : undefined,
          taxCode: row.taxCode || undefined,
          notes: row.notes || undefined,
        }
        await this.prisma.material.upsert({
          where: { code },
          create: data,
          update: data,
        })
        break
      }
      case 'services': {
        const code = row.code?.trim()
        if (!code || !row.name) throw new Error('code and name are required')
        const data = {
          code, name: row.name.trim(),
          description: row.description || undefined,
          category: row.category || undefined,
          pricingType: row.pricingType || 'FIXED',
          unitOfMeasure: row.unitOfMeasure || 'Hour',
          defaultCostRate: row.defaultCostRate ? parseFloat(row.defaultCostRate) : undefined,
          defaultBillRate: row.defaultBillRate ? parseFloat(row.defaultBillRate) : undefined,
          standardHours: row.standardHours ? parseFloat(row.standardHours) : undefined,
          taxCode: row.taxCode || undefined,
          notes: row.notes || undefined,
        }
        await this.prisma.serviceItem.upsert({
          where: { code },
          create: data,
          update: data,
        })
        break
      }
      case 'employees': {
        const employeeNumber = row.employeeNumber?.trim()
        if (!employeeNumber || !row.firstName || !row.lastName || !row.email) {
          throw new Error('employeeNumber, firstName, lastName, email are required')
        }
        const data = {
          employeeNumber, firstName: row.firstName.trim(), lastName: row.lastName.trim(),
          email: row.email.trim().toLowerCase(),
          phone: row.phone || undefined,
          jobTitle: row.jobTitle || undefined,
          employmentType: row.employmentType || undefined,
          costRate: row.costRate ? parseFloat(row.costRate) : undefined,
          billableRate: row.billableRate ? parseFloat(row.billableRate) : undefined,
          notes: row.notes || undefined,
        }
        await this.prisma.employee.upsert({
          where: { employeeNumber },
          create: data,
          update: data,
        })
        break
      }
      case 'departments': {
        const code = row.code?.trim()
        if (!code || !row.name) throw new Error('code and name are required')
        const data = {
          code, name: row.name.trim(),
          description: row.description || undefined,
          notes: row.notes || undefined,
        }
        await this.prisma.department.upsert({
          where: { code },
          create: data,
          update: data,
        })
        break
      }
      default:
        throw new Error(`Unknown entity: ${entity}`)
    }
  }
}
