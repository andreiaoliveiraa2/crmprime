import { createClient } from '@/lib/supabase/server'
import AgendaClient from '@/components/AgendaClient'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: eventos } = await supabase
    .from('agenda')
    .select('*')
    .order('data_hora', { ascending: true })

  return (
    <div className="p-6 md:p-8">
      <AgendaClient eventos={eventos ?? []} />
    </div>
  )
}
