'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import type { Licao } from '@/app/(protected)/prime-academy/whatsapp-prime/licoes'

interface Props {
  licoes: Licao[]
}

export default function WhatsappPrimeClient({ licoes }: Props) {
  const [abertos, setAbertos] = useState<Set<string>>(new Set(['01']))
  const [copiados, setCopiados] = useState<Set<string>>(new Set())

  function toggleAberto(key: string) {
    setAbertos(prev => {
      const novo = new Set(prev)
      novo.has(key) ? novo.delete(key) : novo.add(key)
      return novo
    })
  }

  async function copiar(key: string, texto: string) {
    await navigator.clipboard.writeText(texto)
    setCopiados(prev => new Set(prev).add(key))
    setTimeout(() => {
      setCopiados(prev => {
        const novo = new Set(prev)
        novo.delete(key)
        return novo
      })
    }, 2000)
  }

  return (
    <div className="space-y-3">
      {licoes.map((licao) => {
        const aberto = abertos.has(licao.numero)

        return (
          <div
            key={licao.numero}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
          >
            {/* Cabeçalho da lição */}
            <button
              onClick={() => toggleAberto(licao.numero)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span
                className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: 'rgba(45,31,78,0.08)', color: '#2d1f4e' }}
              >
                {licao.numero}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{licao.titulo}</h3>
                <p className="text-xs text-gray-500">{licao.subtitulo}</p>
              </div>
              <span className="shrink-0 text-gray-400">
                {aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>

            {/* Conteúdo expandido */}
            {aberto && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
                {licao.topicos.map((topico, i) => {
                  const copyKey = `${licao.numero}-${i}`
                  const copiado = copiados.has(copyKey)

                  return (
                    <div key={i}>
                      <h4
                        className="text-xs font-semibold uppercase tracking-wide mb-2"
                        style={{ color: '#b89a6a' }}
                      >
                        {topico.titulo}
                      </h4>

                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-3">
                        {topico.conteudo}
                      </pre>

                      {topico.destaque && (
                        <div
                          className="mt-2 p-3 rounded-lg text-xs text-gray-700 border-l-4 font-medium whitespace-pre-line"
                          style={{ backgroundColor: 'rgba(45,31,78,0.05)', borderColor: '#2d1f4e' }}
                        >
                          {topico.destaque}
                        </div>
                      )}

                      {topico.copiavel && (
                        <button
                          onClick={() => copiar(copyKey, topico.conteudo + (topico.destaque ? '\n\n' + topico.destaque : ''))}
                          className="mt-2 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                          style={copiado
                            ? { backgroundColor: 'rgba(184,154,106,0.15)', color: '#8a6f3a' }
                            : { backgroundColor: 'rgba(45,31,78,0.07)', color: '#2d1f4e' }
                          }
                        >
                          {copiado ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar script</>}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
