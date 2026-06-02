import { ArrowLeft, Zap } from 'lucide-react'
import Link from 'next/link'
import { SCRIPTS } from './scripts'
import MpaClient from '@/components/MpaClient'

export default function MpaPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Voltar */}
      <Link
        href="/prime-academy"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Prime Academy
      </Link>

      {/* Header */}
      <div
        className="rounded-2xl p-6 mb-6 text-white"
        style={{ background: 'linear-gradient(135deg, #2d1f4e 0%, #4a2d7a 100%)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#b89a6a' }}
          >
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#b89a6a' }}>
              ScriptZap
            </p>
            <h1 className="text-xl font-bold leading-tight">MPA — Mensagens que Produzem Apólices</h1>
          </div>
        </div>
        <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {SCRIPTS.length} scripts de vendas prontos para WhatsApp — por Andreia &amp; Giovanna
        </p>
        <div
          className="mt-3 text-xs rounded-lg px-3 py-2 inline-block"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          💡 Scripts de <strong>objeção</strong> = enviar em <strong>áudio</strong> &nbsp;·&nbsp;
          Scripts de <strong>abordagem</strong> = enviar por <strong>texto</strong>
        </div>
      </div>

      {/* Scripts */}
      <MpaClient scripts={SCRIPTS} />
    </div>
  )
}
