import { createClient } from '@/lib/supabase/server'
import PipelineClient from '@/components/PipelineClient'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <PipelineClient leads={leads ?? []} />
    </div>
  )
}
