'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm', label: 'CRM', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setAberto(!aberto)}
        aria-label="Abrir menu"
      >
        {aberto ? <X size={20} /> : <Menu size={20} />}
      </button>

      {aberto && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setAberto(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 flex flex-col
          transition-transform duration-200
          ${aberto ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Gestão Seguros</h2>
          <p className="text-xs text-gray-500 mt-0.5">Sistema de CRM</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setAberto(false)}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-gray-500 hover:text-red-600 transition-colors text-left px-4 py-2 rounded-lg hover:bg-red-50"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
