'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Cliente, Etapa, ETAPAS } from '@/lib/types'

interface Props {
  clientes: Cliente[]
}

const etapaColors: Record<Etapa, string> = {
  Lead: 'border-blue-300 bg-blue-50',
  Contato: 'border-yellow-300 bg-yellow-50',
  Proposta: 'border-purple-300 bg-purple-50',
  Fechado: 'border-green-300 bg-green-50',
  Perdido: 'border-red-300 bg-red-50',
}

const etapaTitleColors: Record<Etapa, string> = {
  Lead: 'text-blue-700',
  Contato: 'text-yellow-700',
  Proposta: 'text-purple-700',
  Fechado: 'text-green-700',
  Perdido: 'text-red-700',
}

export default function KanbanBoard({ clientes: inicial }: Props) {
  const [clientes, setClientes] = useState(inicial)
  const router = useRouter()
  const supabase = createClient()

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const novaEtapa = destination.droppableId as Etapa

    setClientes(prev =>
      prev.map(c => (c.id === draggableId ? { ...c, etapa: novaEtapa } : c))
    )

    await supabase
      .from('clientes')
      .update({ etapa: novaEtapa })
      .eq('id', draggableId)

    router.refresh()
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ETAPAS.map(etapa => {
          const cartoes = clientes.filter(c => c.etapa === etapa)
          return (
            <div key={etapa} className="flex-shrink-0 w-60">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${etapaTitleColors[etapa]}`}>
                  {etapa}
                </h3>
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                  {cartoes.length}
                </span>
              </div>

              <Droppable droppableId={etapa}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[120px] rounded-xl p-2 space-y-2 border-2 transition-colors ${
                      snapshot.isDraggingOver
                        ? etapaColors[etapa]
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {cartoes.map((c, index) => (
                      <Draggable key={c.id} draggableId={c.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {c.nome}
                            </p>
                            {c.contato && (
                              <p className="text-xs text-gray-500">{c.contato}</p>
                            )}
                            {c.data && (
                              <p className="text-xs text-orange-500 mt-1">
                                {new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </p>
                            )}
                            <Link
                              href={`/crm/${c.id}`}
                              className="text-xs text-blue-500 hover:underline mt-1 block"
                              onClick={e => e.stopPropagation()}
                            >
                              Editar
                            </Link>
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
  )
}
