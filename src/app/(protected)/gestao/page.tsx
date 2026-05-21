import { createClient } from '@/lib/supabase/server'
import GestaoClient from '@/components/GestaoClient'

export default async function GestaoPage() {
  const supabase = await createClient()
  const { data: vendedores } = await supabase
    .from('vendedores')
    .select('*')
    .order('nome')

  return (
    <div className="p-6 md:p-8">
      <GestaoClient vendedores={vendedores ?? []} />
    </div>
  )
}
