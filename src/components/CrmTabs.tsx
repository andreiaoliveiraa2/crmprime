'use client'

import { useState } from 'react'
import { LayoutList, Kanban } from 'lucide-react'
import ClienteTable from './ClienteTable'
import KanbanBoard from './KanbanBoard'
import { Cliente } from '@/lib/types'

type Tab = 'lista' | 'kanban'

interface Props {
  clientes: Cliente[]
}

export default function CrmTabs({ clientes }: Props) {
  const [tab, setTab] = useState<Tab>('lista')

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('lista')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'lista'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <LayoutList size={16} />
          Lista
        </button>
        <button
          onClick={() => setTab('kanban')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'kanban'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Kanban size={16} />
          Kanban
        </button>
      </div>

      {tab === 'lista' ? (
        <ClienteTable clientes={clientes} />
      ) : (
        <KanbanBoard clientes={clientes} />
      )}
    </div>
  )
}
