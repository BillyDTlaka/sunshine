'use client'

import './globals.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,             // always refetch when component mounts or window refocuses
        gcTime: 5 * 60 * 1000,   // keep unused cache for 5 min so navigation back is instant
        retry: 1,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
      },
    },
  }))

  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  )
}
