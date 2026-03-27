'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export default function RootPage() {
  const router = useRouter()
  const { token, loadFromStorage, isLoading } = useAuthStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (!isLoading) {
      router.replace(token ? '/dashboard' : '/login')
    }
  }, [isLoading, token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse text-brand font-semibold text-lg">Loading Sunshine...</div>
    </div>
  )
}
