'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/auth.store'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/dashboard/rfqs', label: 'RFQs', icon: '📋' },
  { href: '/dashboard/quotes', label: 'Quotes', icon: '📄' },
  { href: '/dashboard/approvals', label: 'Approvals', icon: '✅' },
  { href: '/dashboard/purchase-orders', label: 'Purchase Orders', icon: '📦' },
  { href: '/dashboard/supplier-selection', label: 'Supplier Selection', icon: '🏭' },
  { href: '/dashboard/pro-formas', label: 'Pro Formas', icon: '🧾' },
  { href: '/dashboard/requisitions', label: 'Requisitions', icon: '📝' },
  { href: '/dashboard/payments', label: 'Payments', icon: '💳' },
  { href: '/dashboard/deliveries', label: 'Deliveries', icon: '🚚' },
  { href: '/dashboard/invoices', label: 'Invoices', icon: '💰' },
  { href: '/dashboard/master-data', label: 'Master Data', icon: '🗂️' },
  { href: '/dashboard/reports', label: 'Reports', icon: '📊' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <span className="text-white text-sm font-black">S</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Sunshine</p>
            <p className="text-xs text-gray-400">IT Services</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-light text-brand font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center">
            <span className="text-brand text-xs font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-red-500 transition-colors text-xs"
            title="Sign out"
          >
            ↩
          </button>
        </div>
      </div>
    </aside>
  )
}
