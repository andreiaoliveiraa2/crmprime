import { createClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/KanbanBoard'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Pipeline</h1>
          <p className="text-sm text-stone-500 mt-1">Funil de vendas — arraste para mover etapas</p>
        </div>
        <Link href="/crm/novo"
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
          <Plus size={16} />
          Novo Lead
        </Link>
      </div>
      <KanbanBoard leads={leads ?? []} />
    </div>
  )
}
