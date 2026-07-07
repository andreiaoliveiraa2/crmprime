import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import GestaoClient from '@/components/GestaoClient'
import Link from 'next/link'
import { NivelVendedor } from '@/lib/types'

export default async function GestaoPage() {
  const usuario = await getUsuarioAtual()
  if (!usuario || usuario.perfil !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const agora = new Date()
  const mesRef = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`

  const [{ data: vendedores }, { data: niveisRaw }, { data: operadorasRaw }, { data: metasEmpresa }] = await Promise.all([
    supabase.from('vendedores').select('*').order('nome'),
    supabase.from('niveis_vendedor').select('*').order('nome'),
    supabase.from('operadoras').select('nome').order('nome'),
    supabase.from('metas').select('operadora, meta_valor').is('vendedor_id', null).eq('mes_referencia', mesRef),
  ])

  const operadoras = (operadorasRaw ?? []).map((o: { nome: string }) => o.nome)
  const metasIniciais: Record<string, number> = {}
  for (const m of (metasEmpresa ?? []) as { operadora: string; meta_valor: number }[]) metasIniciais[m.operadora] = m.meta_valor

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
        operadoras={operadoras}
        mesRef={mesRef}
        metasEmpresaIniciais={metasIniciais}
      />
    </div>
  )
}
