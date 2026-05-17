'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Kanban,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm', label: 'CRM', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/clientes', label: 'Clientes', icon: UserCheck },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
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
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-stone-100 rounded-lg shadow-md"
        onClick={() => setAberto(!aberto)}
        aria-label="Abrir menu"
      >
        {aberto ? (
          <X size={20} className="text-stone-700" />
        ) : (
          <Menu size={20} className="text-stone-700" />
        )}
      </button>

      {aberto && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setAberto(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-stone-100 border-r border-stone-200 z-40 flex flex-col
          transition-transform duration-200
          ${aberto ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="p-6 border-b border-stone-200">
          <h2 className="text-base font-bold text-stone-800">Gestão Seguros</h2>
          <p className="text-xs text-stone-500 mt-0.5">CRM Profissional</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setAberto(false)}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-violet-100 text-violet-700 shadow-sm'
                    : 'text-stone-600 hover:bg-stone-200 hover:text-stone-800'
                }
              `}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
