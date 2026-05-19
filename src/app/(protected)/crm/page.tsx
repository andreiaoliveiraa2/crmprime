import { createClient } from '@/lib/supabase/server'
import PipelineClient from '@/components/PipelineClient'

export default async function CrmPage() {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="p-5 md:p-7">
      <PipelineClient leads={leads ?? []} />
    </div>
  )
}
