import { createClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/KanbanBoard'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function CrmPage() {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="p-5 md:p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#2d1f4e' }}>CRM</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>
            Arraste os cards para mover entre etapas
          </p>
        </div>
        <Link
          href="/crm/novo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}
        >
          <Plus size={15} />
          + Novo Lead
        </Link>
      </div>
      <KanbanBoard leads={leads ?? []} />
    </div>
  )
}
