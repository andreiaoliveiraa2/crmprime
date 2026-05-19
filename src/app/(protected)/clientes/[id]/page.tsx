import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Pencil, ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

const labelCls = 'block text-xs font-semibold mb-0.5'
const labelStyle = { color: '#9a918a' }
const valueCls = 'text-sm font-medium'
const valueStyle = { color: '#2d1f4e' }

function Campo({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <span className={labelCls} style={labelStyle}>{label}</span>
      <span className={`${valueCls} block`} style={valueStyle}>{value ?? '—'}</span>
    </div>
  )
}

const statusCor: Record<string, { bg: string; text: string }> = {
  'Ativo':     { bg: '#dcfce7', text: '#15803d' },
  'Inativo':   { bg: '#fef9c3', text: '#a16207' },
  'Cancelado': { bg: '#fee2e2', text: '#b91c1c' },
}

function fmtData(val: string | null | undefined) {
  if (!val) return null
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return null
    const day = String(d.getUTCDate()).padStart(2, '0')
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const year = d.getUTCFullYear()
    return `${day}/${month}/${year}`
  } catch { return null }
}

function fmtMoeda(val: number | null | undefined) {
  if (val == null) return null
  try {
    return `R$ ${Number(val).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
  } catch { return null }
}

export default async function FichaClientePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: c, error } = await supabase.from('clientes').select('*').eq('id', id).single()

  if (error || !c) notFound()

  const sc = statusCor[(c.status as string)] ?? statusCor['Ativo']

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      {/* Topo */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/clientes"
            className="inline-flex items-center gap-1 text-xs mb-3 hover:opacity-70 transition-opacity"
            style={{ color: '#9a918a' }}>
            <ArrowLeft size={13} /> Voltar para Clientes
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>{c.nome}</h1>
          <div className="mt-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: sc.bg, color: sc.text }}>
              {c.status}
            </span>
          </div>
        </div>
        <Link href={`/clientes/${id}/editar`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          <Pencil size={14} /> Editar
        </Link>
      </div>

      <div className="space-y-5">
        {/* Dados Pessoais */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
          <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ color: '#2d1f4e', borderColor: '#e8e4dd' }}>
            Dados Pessoais
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-3">
              <Campo label="Nome Completo" value={c.nome} />
            </div>
            <Campo label="CPF" value={c.cpf} />
            <Campo label="Data de Nascimento" value={fmtData(c.data_nascimento)} />
            <Campo label="Telefone / WhatsApp" value={c.contato} />
            <Campo label="E-mail" value={c.email} />
            <div className="col-span-2 md:col-span-3">
              <Campo label="Endereço" value={c.endereco} />
            </div>
          </div>
        </div>

        {/* Dados do Plano */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
          <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ color: '#2d1f4e', borderColor: '#e8e4dd' }}>
            Dados do Plano
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Campo label="Operadora" value={c.operadora} />
            <Campo label="Administradora" value={c.administradora} />
            <Campo label="Tipo de Plano" value={c.tipo_plano} />
            <Campo label="Quantidade de Vidas" value={c.quantidade_vidas} />
            <Campo label="Valor do Plano" value={fmtMoeda(c.valor_plano)} />
            <Campo label="Nº do Contrato" value={c.numero_contrato} />
            <Campo label="Data da Venda" value={fmtData(c.data_venda)} />
            <Campo label="Data de Implantação" value={fmtData(c.data_implantacao)} />
            <div>
              <span className={labelCls} style={labelStyle}>Status</span>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: sc.bg, color: sc.text }}>
                {c.status}
              </span>
            </div>
          </div>
        </div>

        {/* Dados Comerciais */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
          <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ color: '#2d1f4e', borderColor: '#e8e4dd' }}>
            Dados Comerciais
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Campo label="Vendedor" value={c.vendedor} />
            <Campo label="Comissão" value={fmtMoeda(c.comissao)} />
            {c.observacoes && (
              <div className="col-span-2 md:col-span-3">
                <span className={labelCls} style={labelStyle}>Observações</span>
                <p className="text-sm mt-0.5" style={{ color: '#5a4e3c' }}>{c.observacoes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
