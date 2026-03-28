'use client'

import { useState, useRef } from 'react'
import { clsx } from 'clsx'
import { Badge } from '@/components/Badge'
import { Card } from '@/components/Card'
import {
  useMasterData, useCreateMasterData, useUpdateMasterData,
  useSetMasterDataStatus, useImportMasterData,
} from '@/lib/hooks'

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { key: 'customers',   label: 'Customers' },
  { key: 'suppliers',   label: 'Suppliers' },
  { key: 'materials',   label: 'Materials' },
  { key: 'services',    label: 'Services' },
  { key: 'employees',   label: 'Employees' },
  { key: 'departments', label: 'Departments' },
] as const

type TabKey = typeof TABS[number]['key']

// ─── Column config per entity ─────────────────────────────────────────────────

const COLUMNS: Record<TabKey, { key: string; label: string }[]> = {
  customers: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'vatNumber', label: 'VAT No.' },
    { key: 'status', label: 'Status' },
  ],
  suppliers: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'contactEmail', label: 'Email' },
    { key: 'leadTimeDays', label: 'Lead Days' },
    { key: 'preferredSupplier', label: 'Preferred' },
    { key: 'status', label: 'Status' },
  ],
  materials: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'unitOfMeasure', label: 'UOM' },
    { key: 'defaultCost', label: 'Cost' },
    { key: 'defaultSellingPrice', label: 'Sell Price' },
    { key: 'status', label: 'Status' },
  ],
  services: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'pricingType', label: 'Pricing' },
    { key: 'defaultBillRate', label: 'Bill Rate' },
    { key: 'status', label: 'Status' },
  ],
  employees: [
    { key: 'employeeNumber', label: 'Emp No.' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'status', label: 'Status' },
  ],
  departments: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
  ],
}

// ─── Form field config per entity ────────────────────────────────────────────

type FieldDef = { key: string; label: string; type?: string; required?: boolean; options?: string[] }

const FIELDS: Record<TabKey, FieldDef[]> = {
  customers: [
    { key: 'code', label: 'Customer Code', required: true },
    { key: 'name', label: 'Name', required: true },
    { key: 'type', label: 'Type', type: 'select', options: ['CORPORATE', 'GOVERNMENT', 'SME', 'INDIVIDUAL', 'OTHER'] },
    { key: 'registrationNumber', label: 'Registration No.' },
    { key: 'vatNumber', label: 'VAT Number' },
    { key: 'creditTerms', label: 'Credit Terms (days)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  suppliers: [
    { key: 'code', label: 'Supplier Code', required: true },
    { key: 'name', label: 'Name', required: true },
    { key: 'type', label: 'Type', type: 'select', options: ['HARDWARE', 'SOFTWARE', 'SERVICES', 'LOGISTICS', 'OTHER'] },
    { key: 'registrationNumber', label: 'Registration No.' },
    { key: 'vatNumber', label: 'VAT Number' },
    { key: 'contactEmail', label: 'Contact Email', type: 'email' },
    { key: 'contactPhone', label: 'Contact Phone' },
    { key: 'paymentTerms', label: 'Payment Terms' },
    { key: 'leadTimeDays', label: 'Lead Time (days)', type: 'number' },
    { key: 'preferredSupplier', label: 'Preferred Supplier', type: 'checkbox' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  materials: [
    { key: 'code', label: 'Material Code', required: true },
    { key: 'name', label: 'Name', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'category', label: 'Category', type: 'select', options: ['HARDWARE', 'SOFTWARE', 'LICENCE', 'CONSUMABLE', 'OTHER'] },
    { key: 'unitOfMeasure', label: 'Unit of Measure' },
    { key: 'defaultCost', label: 'Default Cost (ZAR)', type: 'number' },
    { key: 'defaultSellingPrice', label: 'Default Selling Price (ZAR)', type: 'number' },
    { key: 'defaultMarkupPercent', label: 'Default Markup %', type: 'number' },
    { key: 'taxCode', label: 'Tax Code' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  services: [
    { key: 'code', label: 'Service Code', required: true },
    { key: 'name', label: 'Name', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'category', label: 'Category', type: 'select', options: ['INSTALLATION', 'SUPPORT', 'CONSULTING', 'TRAINING', 'MAINTENANCE', 'OTHER'] },
    { key: 'pricingType', label: 'Pricing Type', type: 'select', options: ['FIXED', 'TIME_AND_MATERIAL', 'UNIT_RATE'] },
    { key: 'unitOfMeasure', label: 'Unit of Measure' },
    { key: 'defaultCostRate', label: 'Default Cost Rate (ZAR)', type: 'number' },
    { key: 'defaultBillRate', label: 'Default Bill Rate (ZAR)', type: 'number' },
    { key: 'standardHours', label: 'Standard Hours', type: 'number' },
    { key: 'taxCode', label: 'Tax Code' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  employees: [
    { key: 'employeeNumber', label: 'Employee Number', required: true },
    { key: 'firstName', label: 'First Name', required: true },
    { key: 'lastName', label: 'Last Name', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone' },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'employmentType', label: 'Employment Type', type: 'select', options: ['PERMANENT', 'CONTRACT', 'PART_TIME', 'INTERN'] },
    { key: 'costRate', label: 'Cost Rate (ZAR/hr)', type: 'number' },
    { key: 'billableRate', label: 'Billable Rate (ZAR/hr)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  departments: [
    { key: 'code', label: 'Department Code', required: true },
    { key: 'name', label: 'Name', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
}

// ─── Import templates ─────────────────────────────────────────────────────────

const IMPORT_HEADERS: Record<TabKey, string[]> = {
  customers:   ['code', 'name', 'type', 'registrationNumber', 'vatNumber', 'notes'],
  suppliers:   ['code', 'name', 'type', 'contactEmail', 'contactPhone', 'paymentTerms', 'leadTimeDays', 'preferredSupplier', 'notes'],
  materials:   ['code', 'name', 'description', 'category', 'unitOfMeasure', 'defaultCost', 'defaultSellingPrice', 'defaultMarkupPercent', 'taxCode', 'notes'],
  services:    ['code', 'name', 'description', 'category', 'pricingType', 'unitOfMeasure', 'defaultCostRate', 'defaultBillRate', 'standardHours', 'taxCode', 'notes'],
  employees:   ['employeeNumber', 'firstName', 'lastName', 'email', 'phone', 'jobTitle', 'employmentType', 'costRate', 'billableRate', 'notes'],
  departments: ['code', 'name', 'description', 'notes'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCell(value: any, colKey: string): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (colKey.toLowerCase().includes('cost') || colKey.toLowerCase().includes('price') || colKey.toLowerCase().includes('rate')) {
    return `R ${Number(value).toFixed(2)}`
  }
  return String(value)
}

function downloadCsvTemplate(entity: TabKey) {
  const headers = IMPORT_HEADERS[entity]
  const csv = headers.join(',') + '\n'
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${entity}_import_template.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

function FormModal({
  entity, record, onClose,
}: {
  entity: TabKey
  record?: any
  onClose: () => void
}) {
  const isEdit = !!record
  const fields = FIELDS[entity]
  const create = useCreateMasterData(entity)
  const update = useUpdateMasterData(entity)

  const [form, setForm] = useState<Record<string, any>>(() => {
    if (!record) return {}
    const f: Record<string, any> = {}
    fields.forEach(field => { f[field.key] = record[field.key] ?? '' })
    return f
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    fields.forEach(f => {
      if (f.required && !form[f.key]) errs[f.key] = `${f.label} is required`
      if (f.type === 'email' && form[f.key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form[f.key])) {
        errs[f.key] = 'Invalid email address'
      }
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const payload: Record<string, any> = {}
    fields.forEach(f => {
      const v = form[f.key]
      if (v === '' || v == null) return
      if (f.type === 'number') payload[f.key] = parseFloat(v) || 0
      else if (f.type === 'checkbox') payload[f.key] = !!v
      else payload[f.key] = v
    })
    try {
      if (isEdit) await update.mutateAsync({ id: record.id, data: payload })
      else await create.mutateAsync(payload)
      onClose()
    } catch (err: any) {
      setErrors({ _form: err?.response?.data?.message ?? 'An error occurred' })
    }
  }

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }))

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit' : 'New'} {entity.slice(0, -1).replace(/\b\w/g, c => c.toUpperCase())}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {errors._form && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errors._form}</p>
          )}
          {fields.map(f => (
            <div key={f.key}>
              <label className="label">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  className="input"
                  rows={3}
                  value={form[f.key] ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                />
              ) : f.type === 'select' ? (
                <select className="input" value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}>
                  <option value="">— Select —</option>
                  {f.options?.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                </select>
              ) : f.type === 'checkbox' ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id={f.key}
                    checked={!!form[f.key]}
                    onChange={e => set(f.key, e.target.checked)}
                    className="w-4 h-4 accent-brand"
                  />
                  <label htmlFor={f.key} className="text-sm text-gray-700">Yes</label>
                </div>
              ) : (
                <input
                  type={f.type ?? 'text'}
                  className="input"
                  value={form[f.key] ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                />
              )}
              {errors[f.key] && <p className="text-xs text-red-500 mt-1">{errors[f.key]}</p>}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              className="btn-primary"
              disabled={create.isPending || update.isPending}
            >
              {create.isPending || update.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

function ImportModal({ entity, onClose }: { entity: TabKey; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const importMutation = useImportMasterData(entity)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImport = async () => {
    if (!file) return
    try {
      const res = await importMutation.mutateAsync(file)
      setResult(res)
    } catch (err: any) {
      setResult({ error: err?.response?.data?.message ?? 'Import failed' })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Import {entity}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
            <p className="font-medium mb-2">Supported formats: .csv, .xlsx, .xls</p>
            <p>Required columns: <span className="font-mono text-xs">{IMPORT_HEADERS[entity].slice(0, 3).join(', ')}...</span></p>
          </div>
          <button
            className="text-sm text-brand underline"
            onClick={() => downloadCsvTemplate(entity)}
          >
            Download CSV template
          </button>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              className="btn-secondary w-full"
              onClick={() => fileRef.current?.click()}
            >
              {file ? file.name : 'Choose file'}
            </button>
          </div>
          {result && (
            <div className={clsx('rounded-xl p-4 text-sm', result.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700')}>
              {result.error ? (
                <p>{result.error}</p>
              ) : (
                <>
                  <p>{result.created} rows imported successfully.</p>
                  {result.errors?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="font-medium">{result.errors.length} rows failed:</p>
                      {result.errors.map((e: any, i: number) => (
                        <p key={i} className="text-xs">Row {e.row}: {e.message}</p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary">Close</button>
            <button
              className="btn-primary"
              disabled={!file || importMutation.isPending}
              onClick={handleImport}
            >
              {importMutation.isPending ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Entity Tab ───────────────────────────────────────────────────────────────

function EntityTab({ entity }: { entity: TabKey }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<'create' | 'edit' | 'import' | null>(null)
  const [selected, setSelected] = useState<any>(null)

  const { data, isLoading } = useMasterData(entity, {
    page, limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  })

  const setStatus = useSetMasterDataStatus(entity)
  const columns = COLUMNS[entity]

  const openEdit = (record: any) => { setSelected(record); setModal('edit') }

  const handleSetStatus = async (record: any) => {
    const next = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await setStatus.mutateAsync({ id: record.id, status: next })
  }

  return (
    <>
      {modal === 'create' && <FormModal entity={entity} onClose={() => setModal(null)} />}
      {modal === 'edit' && selected && <FormModal entity={entity} record={selected} onClose={() => { setModal(null); setSelected(null) }} />}
      {modal === 'import' && <ImportModal entity={entity} onClose={() => setModal(null)} />}

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Search..."
              className="input max-w-xs"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
            <select
              className="input w-36"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setModal('import')} className="btn-secondary text-sm">
              Import
            </button>
            <button onClick={() => setModal('create')} className="btn-primary text-sm">
              + New
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {columns.map(c => (
                  <th key={c.key} className="px-4 py-3 text-left font-medium">{c.label}</th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-400">No records found</td></tr>
              ) : data?.data?.map((row: any) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {columns.map(c => (
                    <td key={c.key} className="px-4 py-3 text-gray-700">
                      {c.key === 'status' ? (
                        <Badge status={row.status} />
                      ) : (
                        formatCell(row[c.key], c.key)
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(row)}
                        className="text-xs text-brand hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleSetStatus(row)}
                        className={clsx('text-xs hover:underline', row.status === 'ACTIVE' ? 'text-red-500' : 'text-green-600')}
                      >
                        {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>{data.total} records</p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="btn-secondary text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <span className="py-1 px-2">Page {page} of {data.totalPages}</span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="btn-secondary text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('customers')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Master Data</h1>
        <p className="text-sm text-gray-500 mt-1">Manage foundational business data</p>
      </div>

      <Card>
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-100 mb-6 -mt-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <EntityTab key={activeTab} entity={activeTab} />
      </Card>
    </div>
  )
}
