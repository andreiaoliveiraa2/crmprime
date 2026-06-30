import { createClient } from '@/lib/supabase/server'
import AgentesClient from '@/components/AgentesClient'

export default async function AgentesPage() {
  const supabase = await createClient()

  const { data: execucoes } = await supabase
    .from('agente_execucoes')
    .select('agente, status, ultima_acao, executado_em')
    .order('executado_em', { ascending: false })

  return <AgentesClient execucoes={execucoes ?? []} />
}
