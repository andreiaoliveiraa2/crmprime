import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LeadTable from '@/components/LeadTable'
import { Plus } from 'lucide-react'

export default async function CrmPage() {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">CRM</h1>
          <p className="text-sm text-stone-500 mt-1">Gestão de leads e negociações</p>
        </div>
        <Link href="/crm/novo"
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
          <Plus size={16} />
          Novo Lead
        </Link>
      </div>
      <LeadTable leads={leads ?? []} />
    </div>
  )
}
