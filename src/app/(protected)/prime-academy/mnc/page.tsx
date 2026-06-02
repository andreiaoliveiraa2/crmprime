import { ArrowLeft, Coffee } from 'lucide-react'
import Link from 'next/link'

export default function MncPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header fixo */}
      <div className="shrink-0 px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-4">
        <Link
          href="/prime-academy"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={15} />
          Prime Academy
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(184,154,106,0.15)' }}
          >
            <Coffee size={14} style={{ color: '#b89a6a' }} />
          </div>
          <span className="text-sm font-semibold text-gray-800">
            MNC — Mulheres, Negócios &amp; Café
          </span>
        </div>
      </div>

      {/* PDF viewer ocupa o resto da tela */}
      <iframe
        src="/prime-academy/mnc.pdf"
        className="flex-1 w-full border-0"
        title="MNC — Mulheres, Negócios & Café"
      />
    </div>
  )
}
