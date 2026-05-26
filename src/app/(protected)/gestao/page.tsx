import { createClient } from '@/lib/supabase/server'
import GestaoClient from '@/components/GestaoClient'
import Link from 'next/link'
import { NivelVendedor } from '@/lib/types'

export default async function GestaoPage() {
  const supabase = await createClient()
  const [{ data: vendedores }, { data: niveisRaw }] = await Promise.all([
    supabase.from('vendedores').select('*').order('nome'),
    supabase.from('niveis_vendedor').select('*').order('nome'),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-semibold px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: 'rgba(184,154,106,0.12)', color: '#2d1f4e', borderLeft: '3px solid #b89a6a', paddingLeft: '10px' }}>
          Vendedores
        </span>
        <Link href="/gestao/operadoras"
          className="text-sm font-medium px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
          style={{ color: '#7a7065' }}>
          Operadoras →
        </Link>
      </div>
      <GestaoClient
        vendedores={vendedores ?? []}
        niveis={(niveisRaw ?? []) as NivelVendedor[]}
      />
    </div>
  )
}
