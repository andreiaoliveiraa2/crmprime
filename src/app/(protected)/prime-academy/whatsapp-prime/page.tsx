import { ArrowLeft, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { LICOES } from './licoes'
import WhatsappPrimeClient from '@/components/WhatsappPrimeClient'

export default function WhatsappPrimePage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
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
        style={{ background: 'linear-gradient(135deg, #2d1f4e 0%, #3d2a63 100%)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#b89a6a' }}
          >
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#b89a6a' }}>
              Guia Completo
            </p>
            <h1 className="text-xl font-bold leading-tight">WhatsApp Prime</h1>
          </div>
        </div>
        <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {LICOES.length} lições para transformar o WhatsApp em sua principal ferramenta de vendas
        </p>
      </div>

      <WhatsappPrimeClient licoes={LICOES} />
    </div>
  )
}
