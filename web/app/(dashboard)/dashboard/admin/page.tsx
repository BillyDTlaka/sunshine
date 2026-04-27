'use client'

import Link from 'next/link'
import { Card } from '@/components/Card'

const ADMIN_SECTIONS = [
  {
    title: 'Master Data',
    description: 'Manage clients, suppliers, materials, services, employees and departments',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7a2 2 0 012-2h12a2 2 0 012 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7zM4 13a2 2 0 012-2h12a2 2 0 012 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1zM4 19a2 2 0 012-2h12a2 2 0 012 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1z" />
      </svg>
    ),
    href: '/dashboard/master-data',
    items: ['Customers', 'Suppliers', 'Materials', 'Services', 'Employees', 'Departments'],
    color: '#8B3A3A',
  },
  {
    title: 'Users & Roles',
    description: 'Manage system users, roles and access permissions',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    href: '/dashboard/admin/users',
    items: ['System Users', 'Role Assignments', 'Permissions'],
    color: '#7C3AED',
    comingSoon: true,
  },
  {
    title: 'Settings',
    description: 'Configure number sequences, markup rules, quote templates and approval thresholds',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    href: '/dashboard/markup',
    items: ['Markup Rules', 'Number Sequences', 'Quote Templates', 'Approval Thresholds'],
    color: '#D97706',
    comingSoon: false,
  },
  {
    title: 'Procurement',
    description: 'Manage supplier awards, pro forma invoices, requisitions and payments',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    href: '/dashboard/project-admin',
    items: ['Supplier Awards', 'Pro Formas', 'Requisitions', 'Payments'],
    color: '#2563EB',
  },
  {
    title: 'Financials',
    description: 'Client invoices, purchase orders and financial records',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    href: '/dashboard/invoices',
    items: ['Client Invoices', 'Purchase Orders', 'Deliveries'],
    color: '#059669',
  },
]

export default function AdminPage() {
  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="page-title">Admin</h1>
        <p className="text-sm text-gray-500 mt-0.5">System configuration and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ADMIN_SECTIONS.map(section => (
          <div key={section.title} className="group">
            {section.comingSoon ? (
              <Card className="h-full opacity-75 cursor-not-allowed">
                <SectionContent section={section} />
              </Card>
            ) : (
              <Link href={section.href}>
                <Card className="h-full hover:shadow-md transition-all cursor-pointer border hover:border-brand/30">
                  <SectionContent section={section} />
                </Card>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionContent({ section }: { section: typeof ADMIN_SECTIONS[0] }) {
  return (
    <div className="flex gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${section.color}18`, color: section.color }}
      >
        {section.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-semibold text-gray-900">{section.title}</h2>
          {section.comingSoon && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Coming soon</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-2">{section.description}</p>
        <div className="flex flex-wrap gap-1">
          {section.items.map(item => (
            <span key={item} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
