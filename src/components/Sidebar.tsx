'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCheck, Calendar,
  DollarSign, BarChart2, Megaphone, Settings, LogOut, Menu, X, GraduationCap, Calculator,
  MessageSquare, Bot, Sparkles,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LucideIcon } from 'lucide-react'
import BuscaGlobal from '@/components/BuscaGlobal'

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: boolean; external?: boolean }

const COTADOR = { href: 'https://cotadorsimplificado.com.br/', label: 'Cotador', icon: Calculator, external: true }

const NAV_ADMIN: NavItem[] = [
  { href: '/dashboard',     label: 'Meu Dia',      icon: LayoutDashboard },
  { href: '/crm',           label: 'CRM',           icon: Users           },
  { href: '/clientes',      label: 'Clientes',      icon: UserCheck       },
  { href: '/agenda',        label: 'Agenda',        icon: Calendar, badge: true },
  { href: '/financeiro',    label: 'Financeiro',    icon: DollarSign      },
  { href: '/gestao',        label: 'Gestão',        icon: BarChart2       },
  { href: '/marketing',      label: 'Marketing',      icon: Megaphone      },
  { href: '/agentes',        label: 'Agentes',       icon: Bot             },
  { href: '/prime-academy',  label: 'Prime Academy',  icon: GraduationCap  },
  COTADOR,
  { href: '/whatsapp',       label: 'WhatsApp IA',    icon: MessageSquare  },
  { href: '/configuracoes',  label: 'Configurações',  icon: Settings       },
]

const NAV_VENDEDOR: NavItem[] = [
  { href: '/dashboard',        label: 'Meu Dia',       icon: LayoutDashboard },
  { href: '/crm',              label: 'CRM',           icon: Users           },
  { href: '/clientes',         label: 'Clientes',      icon: UserCheck       },
  { href: '/agenda',           label: 'Agenda',        icon: Calendar, badge: true },
  { href: '/minhas-comissoes', label: 'Comissões',     icon: DollarSign      },
  { href: '/prime-academy',    label: 'Prime Academy', icon: GraduationCap   },
  COTADOR,
]

interface Props {
  perfil: 'admin' | 'vendedor'
  nome: string
}

export default function Sidebar({ perfil, nome }: Props) {
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)
  const [agendaHoje, setAgendaHoje] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  const navItems = perfil === 'admin' ? NAV_ADMIN : NAV_VENDEDOR

  useEffect(() => {
    const inicio = new Date(); inicio.setHours(0,0,0,0)
    const fim = new Date(); fim.setHours(23,59,59,999)
    supabase.from('agenda').select('id', { count: 'exact', head: true })
      .gte('data_hora', inicio.toISOString())
      .lte('data_hora', fim.toISOString())
      .then(({ count }) => setAgendaHoje(count ?? 0))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('')

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-md"
        style={{ backgroundColor: '#2d1f4e' }}
        onClick={() => setAberto(!aberto)}
        aria-label="Abrir menu"
      >
        {aberto ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
      </button>

      {aberto && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setAberto(false)} />
      )}

      <aside
        className={`print:hidden fixed top-0 left-0 h-full w-64 z-40 flex flex-col transition-transform duration-200 ${aberto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ backgroundColor: '#2d1f4e' }}
      >
        <div className="px-6 py-5 flex items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Image
            src="/logo-a2prime.png"
            alt="A2 Prime"
            width={48}
            height={48}
            className="object-cover rounded-full"
            style={{ width: '48px', height: '48px' }}
            priority
          />
        </div>

        <div className="px-3 pt-2 pb-1">
          <BuscaGlobal />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, badge, external }) => {
            const active = isActive(href)
            const showBadge = badge && agendaHoje > 0
            const itemStyle = {
              color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
              backgroundColor: active ? 'rgba(184,154,106,0.12)' : 'transparent',
              borderLeft: active ? '3px solid #b89a6a' : '3px solid transparent',
              paddingLeft: '12px',
            }
            const itemClass = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
            const content = (
              <>
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                    style={{ backgroundColor: '#b89a6a', color: '#2d1f4e' }}>
                    {agendaHoje}
                  </span>
                )}
              </>
            )
            if (external) {
              return (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  onClick={() => setAberto(false)}
                  className={itemClass} style={itemStyle}>
                  {content}
                </a>
              )
            }
            return (
              <Link key={href} href={href} onClick={() => setAberto(false)}
                className={itemClass} style={itemStyle}>
                {content}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none"
              style={{ backgroundColor: '#b89a6a', color: '#2d1f4e' }}
            >
              {iniciais}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{nome}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {perfil === 'admin' ? 'Admin · A2 Prime' : 'Vendedor'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-red-500/10 hover:text-red-400"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
