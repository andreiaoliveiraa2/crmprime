'use client'

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, EtapaLead, ETAPAS_LEAD } from '@/lib/types'
import Link from 'next/link'
import { Plus, Calendar, User, ArrowRight, Clock } from 'lucide-react'
import { isParado, diasParado } from '@/lib/leads'

interface Props {
  leads: Lead[]
  onLeadMoved: (id: string, novaEtapa: EtapaLead) => void
}

const etapaAccent: Record<EtapaLead, string> = {
  'Novo Lead':     '#6b7280',
  'Contato Feito': '#1d4ed8',
  'Cotação':       '#b89a6a',
  'Negociação':    '#c2410c',
  'Vendido':       '#15803d',
  'Perdido':       '#be185d',
}

export default function KanbanBoard({ leads, onLeadMoved }: Props) {
  const router = useRouter()
  const supabase = createClient()

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const novaEtapa = destination.droppableId as EtapaLead
    const etapaAnterior = source.droppableId as EtapaLead

    if (novaEtapa === 'Perdido') {
      if (!confirm('Marcar este lead como Perdido?')) return
    }

    // Atualiza o estado no pai imediatamente
    onLeadMoved(draggableId, novaEtapa)

    const { data, error } = await supabase
      .from('leads')
      .update({ etapa: novaEtapa })
      .eq('id', draggableId)
      .select('id')

    if (error) {
      console.error('[Kanban] Erro ao salvar etapa:', error.message, error.details)
      onLeadMoved(draggableId, etapaAnterior)
    } else if (!data || data.length === 0) {
      console.warn('[Kanban] Update sem efeito — nenhuma linha atualizada. Lead ID:', draggableId)
      // Não reverte: o lead pode ter sido excluído ou RLS bloqueou
    }
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 items-start">
          {ETAPAS_LEAD.map(etapa => {
            const cartoes = leads.filter(l => l.etapa === etapa)
            const accent = etapaAccent[etapa]

            return (
              <div key={etapa} className="flex-shrink-0 w-52 flex flex-col">

                {/* Cabeçalho da coluna */}
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-t-xl"
                  style={{ backgroundColor: '#2d1f4e' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: accent }}
                    />
                    <h3 className="text-xs font-semibold text-white truncate">{etapa}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
                    >
                      {cartoes.length}
                    </span>
                    <Link
                      href={`/crm/novo`}
                      className="flex items-center justify-center w-5 h-5 rounded-md transition-colors"
                      style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
                      title={`Novo lead em ${etapa}`}
                    >
                      <Plus size={11} />
                    </Link>
                  </div>
                </div>

                {/* Área droppable */}
                <Droppable droppableId={etapa}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 rounded-b-xl p-2 space-y-2 min-h-[120px] transition-colors duration-150"
                      style={{
                        backgroundColor: snapshot.isDraggingOver
                          ? 'rgba(45,31,78,0.06)'
                          : '#f4f1ec',
                        border: '1px solid #e8e4dd',
                        borderTop: 'none',
                      }}
                    >
                      {cartoes.map((l, index) => (
                        <Draggable key={l.id} draggableId={l.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white rounded-xl p-3 cursor-grab active:cursor-grabbing transition-shadow"
                              style={{
                                border: '1px solid #e8e4dd',
                                boxShadow: snapshot.isDragging
                                  ? '0 8px 24px rgba(45,31,78,0.15)'
                                  : '0 1px 3px rgba(0,0,0,0.06)',
                                ...provided.draggableProps.style,
                              }}
                            >
                              {/* Nome + badge de status */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-sm font-semibold leading-snug" style={{ color: '#2d1f4e' }}>
                                  {l.nome}
                                </p>
                                <span
                                  className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                                  style={{ backgroundColor: `${accent}18`, color: accent }}
                                >
                                  {l.etapa}
                                </span>
                              </div>

                              {/* Badge de lead parado */}
                              {isParado(l) && (
                                <div className="flex items-center gap-1 mb-1.5">
                                  <Clock size={13} style={{ color: '#ea580c' }} />
                                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                                    style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                                    {diasParado(l)} dias
                                  </span>
                                </div>
                              )}

                              {/* Tipo de plano · Operadora */}
                              {(l.tipo_plano || l.operadora) && (
                                <p className="text-xs mb-1.5" style={{ color: '#7a7065' }}>
                                  {[l.tipo_plano, l.operadora].filter(Boolean).join(' · ')}
                                </p>
                              )}

                              {/* Data de entrada */}
                              <div className="flex items-center gap-1 mb-1">
                                <Calendar size={10} style={{ color: '#b89a6a' }} />
                                <span className="text-xs" style={{ color: '#9a918a' }}>
                                  {l.criado_em
                                    ? new Date(l.criado_em).toLocaleDateString('pt-BR')
                                    : '—'}
                                </span>
                              </div>

                              {/* Responsável */}
                              <div className="flex items-center gap-1">
                                <User size={10} style={{ color: '#b89a6a' }} />
                                <span className="text-xs" style={{ color: '#9a918a' }}>
                                  {l.responsavel ?? '—'}
                                </span>
                              </div>

                              {/* Botão converter — só na coluna Vendido */}
                              {etapa === 'Vendido' && (
                                <button
                                  onClick={e => { e.stopPropagation(); router.push(`/clientes/novo?lead_id=${l.id}`) }}
                                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                                  style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}
                                >
                                  <ArrowRight size={11} />
                                  Converter em Cliente
                                </button>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

              </div>
            )
          })}
        </div>
      </DragDropContext>

    </>
  )
}
