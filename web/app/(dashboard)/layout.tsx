'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { useAuthStore } from '@/store/auth.store'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, isLoading, loadFromStorage } = useAuthStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (!isLoading && !token) router.push('/login')
  }, [isLoading, token, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-brand font-semibold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
