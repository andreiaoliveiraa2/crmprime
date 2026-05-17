'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, EtapaLead, ETAPAS_LEAD } from '@/lib/types'
import ConversaoModal from './ConversaoModal'

interface Props {
  leads: Lead[]
}

const etapaStyle: Record<EtapaLead, { col: string; title: string }> = {
  'Novo Lead': { col: 'bg-blue-50 border-blue-200', title: 'text-blue-700' },
  'Contato Feito': { col: 'bg-yellow-50 border-yellow-200', title: 'text-yellow-700' },
  'Proposta Enviada': { col: 'bg-purple-50 border-purple-200', title: 'text-purple-700' },
  'Negociação': { col: 'bg-amber-50 border-amber-200', title: 'text-amber-700' },
  'Fechado': { col: 'bg-emerald-50 border-emerald-200', title: 'text-emerald-700' },
  'Perdido': { col: 'bg-red-50 border-red-200', title: 'text-red-600' },
}

export default function KanbanBoard({ leads: inicial }: Props) {
  const [leads, setLeads] = useState(inicial)
  const [leadConvertendo, setLeadConvertendo] = useState<Lead | null>(null)
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

    setLeads(prev =>
      prev.map(l => (l.id === draggableId ? { ...l, etapa: novaEtapa } : l))
    )

    const { error } = await supabase
      .from('leads')
      .update({ etapa: novaEtapa })
      .eq('id', draggableId)

    if (error) {
      setLeads(prev =>
        prev.map(l => (l.id === draggableId ? { ...l, etapa: etapaAnterior } : l))
      )
      return
    }

    if (novaEtapa === 'Fechado') {
      // Use inicial para identidade estável do lead (id, nome, telefone, tipo_plano)
      const lead = inicial.find(l => l.id === draggableId) ?? leads.find(l => l.id === draggableId)
      if (lead) setLeadConvertendo({ ...lead, etapa: 'Fechado' })
    } else {
      router.refresh()
    }
  }

  async function handleCancelarConversao() {
    if (!leadConvertendo) return
    setLeads(prev =>
      prev.map(l => (l.id === leadConvertendo.id ? { ...l, etapa: 'Negociação' } : l))
    )
    const { error } = await supabase
      .from('leads')
      .update({ etapa: 'Negociação' })
      .eq('id', leadConvertendo.id)
    if (error) {
      setLeads(prev =>
        prev.map(l => (l.id === leadConvertendo.id ? { ...l, etapa: 'Fechado' } : l))
      )
    }
    setLeadConvertendo(null)
    router.refresh()
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ETAPAS_LEAD.map(etapa => {
            const cartoes = leads.filter(l => l.etapa === etapa)
            const style = etapaStyle[etapa]
            return (
              <div key={etapa} className="flex-shrink-0 w-52">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-xs font-bold uppercase tracking-wide ${style.title}`}>
                    {etapa}
                  </h3>
                  <span className="text-xs bg-white border border-stone-200 rounded-full px-2 py-0.5 text-stone-500">
                    {cartoes.length}
                  </span>
                </div>

                <Droppable droppableId={etapa}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[120px] rounded-2xl p-2 space-y-2 border-2 transition-colors ${
                        snapshot.isDraggingOver ? style.col : 'border-stone-100 bg-stone-50'
                      }`}
                    >
                      {cartoes.map((l, index) => (
                        <Draggable key={l.id} draggableId={l.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-xl border border-stone-200 p-3 cursor-grab active:cursor-grabbing transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
                              }`}
                            >
                              <p className="text-sm font-semibold text-stone-800 mb-1">
                                {l.nome}
                              </p>
                              {l.telefone && (
                                <p className="text-xs text-stone-400">{l.telefone}</p>
                              )}
                              {l.tipo_plano && (
                                <span className="mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">
                                  {l.tipo_plano}
                                </span>
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

      {leadConvertendo && (
        <ConversaoModal
          lead={leadConvertendo}
          onClose={() => {
            setLeadConvertendo(null)
            router.refresh()
          }}
          onCancelar={handleCancelarConversao}
          onReverteFechado={handleCancelarConversao}
        />
      )}
    </>
  )
}
