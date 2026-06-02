import { GraduationCap, Zap, BookOpen, MessageCircle } from 'lucide-react'
import Link from 'next/link'

const MODULOS = [
  {
    href: '/prime-academy/mpa',
    icon: Zap,
    cor: '#2d1f4e',
    corBg: 'rgba(45,31,78,0.08)',
    titulo: 'MPA — ScriptZap',
    subtitulo: 'Método Mensagens que Produzem Apólices',
    descricao: '20 scripts prontos de abordagem e objeção para WhatsApp',
    badge: '20 scripts',
    disponivel: true,
  },
  {
    href: '/prime-academy/whatsapp-prime',
    icon: MessageCircle,
    cor: '#2d1f4e',
    corBg: 'rgba(45,31,78,0.08)',
    titulo: 'WhatsApp Prime',
    subtitulo: 'Guia completo de vendas pelo WhatsApp',
    descricao: '6 lições de configuração, comunicação e fechamento',
    badge: '6 lições',
    disponivel: true,
  },
{
    href: '#',
    icon: BookOpen,
    cor: '#b89a6a',
    corBg: 'rgba(184,154,106,0.08)',
    titulo: 'Central das Operadoras',
    subtitulo: 'Regras, carências e documentos',
    descricao: 'Amil, Bradesco, SulAmérica, Hapvida e mais — em breve',
    badge: 'Em breve',
    disponivel: false,
  },
]

export default function PrimeAcademyPage() {
  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <GraduationCap size={28} style={{ color: '#b89a6a' }} />
        <h1 className="text-2xl font-bold text-gray-900">Prime Academy</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Central de conhecimento, treinamento e consulta operacional da A2 Prime.
      </p>

      {/* Módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {MODULOS.map(({ href, icon: Icon, cor, corBg, titulo, subtitulo, descricao, badge, disponivel }) => (
          <Link
            key={titulo}
            href={href}
            className={`group block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all ${disponivel ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'opacity-60 cursor-not-allowed pointer-events-none'}`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: corBg }}
              >
                <Icon size={20} style={{ color: cor }} />
              </div>
              <span
                className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: corBg, color: cor }}
              >
                {badge}
              </span>
            </div>
            <h2 className="text-base font-bold text-gray-900">{titulo}</h2>
            <p className="text-xs font-medium mb-1" style={{ color: cor }}>{subtitulo}</p>
            <p className="text-xs text-gray-500">{descricao}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
