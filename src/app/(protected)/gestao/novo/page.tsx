import { createClient } from '@/lib/supabase/server'
import VendedorForm from '@/components/VendedorForm'
import { NivelVendedor } from '@/lib/types'

export default async function NovoVendedorPage() {
  const supabase = await createClient()
  const { data: niveisRaw } = await supabase
    .from('niveis_vendedor')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Novo Vendedor</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>
          Cadastre um vendedor ou corretor
        </p>
      </div>
      <VendedorForm niveis={(niveisRaw ?? []) as NivelVendedor[]} />
    </div>
  )
}
