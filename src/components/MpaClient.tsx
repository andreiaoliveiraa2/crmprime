'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Check, Mic, MessageSquare } from 'lucide-react'
import type { Script, Categoria } from '@/app/(protected)/prime-academy/mpa/scripts'

interface Props {
  scripts: Script[]
}

export default function MpaClient({ scripts }: Props) {
  const [filtro, setFiltro] = useState<'todos' | Categoria>('todos')
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [copiados, setCopiados] = useState<Set<string>>(new Set())

  const filtrados = filtro === 'todos' ? scripts : scripts.filter(s => s.categoria === filtro)

  function toggleAberto(numero: string) {
    setAbertos(prev => {
      const novo = new Set(prev)
      novo.has(numero) ? novo.delete(numero) : novo.add(numero)
      return novo
    })
  }

  async function copiar(script: Script) {
    const texto = `${script.titulo}\n\n${script.conteudo}${script.dica ? `\n\n💡 Dica: ${script.dica}` : ''}`
    await navigator.clipboard.writeText(texto)
    setCopiados(prev => new Set(prev).add(script.numero))
    setTimeout(() => {
      setCopiados(prev => {
        const novo = new Set(prev)
        novo.delete(script.numero)
        return novo
      })
    }, 2000)
  }

  const total = scripts.length
  const abordagens = scripts.filter(s => s.categoria === 'abordagem').length
  const objecoes = scripts.filter(s => s.categoria === 'objecao').length

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {([
          { key: 'todos', label: `Todos (${total})` },
          { key: 'abordagem', label: `Abordagens (${abordagens})` },
          { key: 'objecao', label: `Objeções (${objecoes})` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={filtro === key
              ? { backgroundColor: '#2d1f4e', color: '#fff' }
              : { backgroundColor: '#f0ede8', color: '#5a5057' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de scripts */}
      <div className="space-y-3">
        {filtrados.map((script) => {
          const aberto = abertos.has(script.numero)
          const copiado = copiados.has(script.numero)
          const isObjecao = script.categoria === 'objecao'
          const isAudio = script.formato === 'audio'

          return (
            <div
              key={script.numero}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
            >
              {/* Cabeçalho do card */}
              <button
                onClick={() => toggleAberto(script.numero)}
                className="w-full flex items-start gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                {/* Número */}
                <span
                  className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: 'rgba(184,154,106,0.15)', color: '#b89a6a' }}
                >
                  {script.numero}
                </span>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{script.titulo}</h3>
                  <p className="text-xs text-gray-500">{script.descricao}</p>
                  <div className="flex gap-2 mt-1.5">
                    {/* Tag categoria */}
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={isObjecao
                        ? { backgroundColor: 'rgba(45,31,78,0.10)', color: '#2d1f4e' }
                        : { backgroundColor: 'rgba(184,154,106,0.15)', color: '#8a6f3a' }
                      }
                    >
                      {isObjecao ? 'Objeção' : 'Abordagem'}
                    </span>
                    {/* Tag formato */}
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={isAudio
                        ? { backgroundColor: 'rgba(45,31,78,0.07)', color: '#2d1f4e' }
                        : { backgroundColor: 'rgba(184,154,106,0.10)', color: '#8a6f3a' }
                      }
                    >
                      {isAudio
                        ? <><Mic size={10} /> Áudio</>
                        : <><MessageSquare size={10} /> Texto</>
                      }
                    </span>
                  </div>
                </div>

                {/* Seta */}
                <span className="shrink-0 text-gray-400 mt-1">
                  {aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {/* Conteúdo expandido */}
              {aberto && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-4">
                    {script.conteudo}
                  </pre>

                  {script.dica && (
                    <div
                      className="mt-3 p-3 rounded-lg text-xs text-gray-600 border-l-4"
                      style={{ backgroundColor: 'rgba(184,154,106,0.08)', borderColor: '#b89a6a' }}
                    >
                      <span className="font-semibold" style={{ color: '#b89a6a' }}>💡 Dica profissional: </span>
                      {script.dica}
                    </div>
                  )}

                  <button
                    onClick={() => copiar(script)}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={copiado
                      ? { backgroundColor: 'rgba(184,154,106,0.15)', color: '#8a6f3a' }
                      : { backgroundColor: 'rgba(45,31,78,0.07)', color: '#2d1f4e' }
                    }
                  >
                    {copiado ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar script</>}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
