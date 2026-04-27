'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { useAiPrompts, useUpdateAiPrompt } from '@/lib/hooks'

export default function AiPromptsPage() {
  const { data: prompts, isLoading } = useAiPrompts()
  const { mutate: updatePrompt, isPending } = useUpdateAiPrompt()
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<{ name: string; description: string; prompt: string }>({ name: '', description: '', prompt: '' })
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState('')

  const startEdit = (p: any) => {
    setEditing(p.id)
    setForm({ name: p.name, description: p.description ?? '', prompt: p.prompt })
    setSaved(null)
    setError('')
  }

  const cancel = () => { setEditing(null); setError('') }

  const handleSave = () => {
    if (!editing) return
    setError('')
    updatePrompt(
      { id: editing, data: { name: form.name, description: form.description || undefined, prompt: form.prompt } },
      {
        onSuccess: () => { setSaved(editing); setEditing(null) },
        onError: (err: any) => setError(err?.response?.data?.message ?? 'Save failed'),
      },
    )
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/admin" className="hover:text-brand">Admin</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">AI Prompts</span>
      </div>

      <div>
        <h1 className="page-title">AI Prompts</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage the prompts used by AI features across the platform.</p>
      </div>

      {isLoading && <div className="text-gray-400 py-8 text-center">Loading...</div>}

      <div className="space-y-4">
        {((prompts ?? []) as any[]).map((p: any) => (
          <Card key={p.id}>
            {editing === p.id ? (
              <div className="space-y-4">
                <div>
                  <label className="label">Name</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Description</label>
                  <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of what this prompt does" />
                </div>
                <div>
                  <label className="label">Prompt</label>
                  <textarea
                    className="input resize-none font-mono text-xs leading-relaxed"
                    rows={20}
                    value={form.prompt}
                    onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.prompt.length} characters</p>
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
                <div className="flex gap-3">
                  <button onClick={handleSave} disabled={isPending} className="btn-primary">
                    {isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={cancel} className="btn-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-gray-900">{p.name}</h2>
                      <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{p.key}</span>
                      {saved === p.id && (
                        <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Saved
                        </span>
                      )}
                    </div>
                    {p.description && <p className="text-sm text-gray-500 mb-3">{p.description}</p>}
                    <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 max-h-48 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{p.prompt}</pre>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {p.prompt.length} chars
                      {p.updatedAt && ` · Last updated ${new Date(p.updatedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                    </p>
                  </div>
                  <button onClick={() => startEdit(p)} className="btn-secondary flex-shrink-0 flex items-center gap-1.5 text-xs">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
