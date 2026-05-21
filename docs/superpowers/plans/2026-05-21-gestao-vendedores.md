# Gestão de Vendedores — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o módulo /gestao para cadastrar, listar, editar e visualizar vendedores/corretores, com integração automática nos dropdowns de todo o sistema.

**Architecture:** Server components nas páginas (fetching no servidor), Client components para interatividade (tabela, formulário, ficha). Formulário em accordion com 5 secções. Relação com leads/clientes/vendas por texto (nome), sem FK.

**Tech Stack:** Next.js App Router, Supabase (client + server), TypeScript, Tailwind CSS, Lucide React

---

## File Map

| Ficheiro | Ação | Responsabilidade |
|---|---|---|
| `src/lib/types.ts` | Modificar | Expandir interface `Vendedor` + constantes |
| `src/components/GestaoClient.tsx` | Criar | Tabela + filtros + badges + ações |
| `src/components/VendedorForm.tsx` | Criar | Formulário em accordion (5 secções) |
| `src/components/FichaVendedor.tsx` | Criar | Cards de dados + histórico de produção |
| `src/app/(protected)/gestao/page.tsx` | Criar | Server page — lista vendedores |
| `src/app/(protected)/gestao/novo/page.tsx` | Criar | Server page — shell para criação |
| `src/app/(protected)/gestao/[id]/page.tsx` | Criar | Server page — busca vendedor + vendas + comissões |
| `src/app/(protected)/gestao/[id]/editar/page.tsx` | Criar | Server page — busca vendedor para edição |
| `supabase/migrations/20260521_gestao_vendedores.sql` | Criar | Documentação da migration já executada |

> **Nota:** `src/components/Sidebar.tsx` já tem `/gestao` no `navItems` (linha 27) — não precisa ser editado.

---

## Task 1: Migration file (documentação)

**Files:**
- Create: `supabase/migrations/20260521_gestao_vendedores.sql`

> O SQL já foi executado no Supabase. Esta task apenas documenta a migration no repositório.

- [ ] **Criar ficheiro de migration**

```sql
-- Module: Gestão de Vendedores
-- Already executed in Supabase on 2026-05-21

create table if not exists vendedores (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Dados pessoais
alter table vendedores add column if not exists cpf_cnpj             text;
alter table vendedores add column if not exists rg                   text;
alter table vendedores add column if not exists data_nascimento      date;
alter table vendedores add column if not exists sexo                 text;
alter table vendedores add column if not exists telefone             text;
alter table vendedores add column if not exists email                text;
alter table vendedores add column if not exists endereco_cep         text;
alter table vendedores add column if not exists endereco_logradouro  text;
alter table vendedores add column if not exists endereco_numero      text;
alter table vendedores add column if not exists endereco_complemento text;
alter table vendedores add column if not exists endereco_bairro      text;
alter table vendedores add column if not exists endereco_cidade      text;
alter table vendedores add column if not exists endereco_estado      text;

-- Dados profissionais
alter table vendedores add column if not exists tipo           text;
alter table vendedores add column if not exists corretora      text;
alter table vendedores add column if not exists data_admissao  date;
alter table vendedores add column if not exists data_demissao  date;
alter table vendedores add column if not exists susep          text;

-- Configuração de repasse
alter table vendedores add column if not exists percentual_repasse   numeric(5,2);
alter table vendedores add column if not exists forma_repasse        text;
alter table vendedores add column if not exists repasse_sobre        text;
alter table vendedores add column if not exists tem_vitalicio        boolean not null default false;
alter table vendedores add column if not exists percentual_vitalicio numeric(5,2);

-- Informações bancárias
alter table vendedores add column if not exists banco      text;
alter table vendedores add column if not exists agencia    text;
alter table vendedores add column if not exists conta      text;
alter table vendedores add column if not exists tipo_conta text;
alter table vendedores add column if not exists pix        text;

-- Observações
alter table vendedores add column if not exists observacoes text;
```

- [ ] **Commit**

```bash
git add supabase/migrations/20260521_gestao_vendedores.sql
git commit -m "feat: migration — expandir tabela vendedores (já executada)"
```

---

## Task 2: Expandir tipo Vendedor em types.ts

**Files:**
- Modify: `src/lib/types.ts:58-63`

- [ ] **Substituir a interface `Vendedor` e `VendedorInsert` existentes, e adicionar constantes**

Localizar este bloco em `src/lib/types.ts`:
```typescript
export interface Vendedor {
  id: string
  nome: string
  ativo: boolean
  criado_em: string
}

export interface Operadora {
```

Substituir por:
```typescript
export const TIPOS_VENDEDOR = ['Interno', 'Afiliado', 'Corretor Parceiro'] as const
export const CORRETORAS_VENDEDOR = ['A2 Prime', 'A2 Corretora', 'MEI Alessandro'] as const
export const FORMAS_REPASSE = ['No recebimento', 'Antecipado'] as const
export const REPASSE_SOBRE = [
  'Comissão Recebida',
  'Comissão Prevista',
  'Prêmio Líquido',
  'Valor Fixo',
  'Repasse por Vida',
] as const

export interface Vendedor {
  id: string
  nome: string
  ativo: boolean
  criado_em: string
  // Dados pessoais
  cpf_cnpj: string | null
  rg: string | null
  data_nascimento: string | null
  sexo: string | null
  telefone: string | null
  email: string | null
  endereco_cep: string | null
  endereco_logradouro: string | null
  endereco_numero: string | null
  endereco_complemento: string | null
  endereco_bairro: string | null
  endereco_cidade: string | null
  endereco_estado: string | null
  // Dados profissionais
  tipo: string | null
  corretora: string | null
  data_admissao: string | null
  data_demissao: string | null
  susep: string | null
  // Configuração de repasse
  percentual_repasse: number | null
  forma_repasse: string | null
  repasse_sobre: string | null
  tem_vitalicio: boolean
  percentual_vitalicio: number | null
  // Informações bancárias
  banco: string | null
  agencia: string | null
  conta: string | null
  tipo_conta: string | null
  pix: string | null
  // Observações
  observacoes: string | null
}

export interface Operadora {
```

Localizar também:
```typescript
export type VendedorInsert = Omit<Vendedor, 'id' | 'criado_em'>
```
— já existe e não precisa de alteração; continua correto.

- [ ] **Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: expandir interface Vendedor com todos os campos do módulo Gestão"
```

---

## Task 3: GestaoClient — tabela principal

**Files:**
- Create: `src/components/GestaoClient.tsx`

- [ ] **Criar o componente**

```tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Vendedor, TIPOS_VENDEDOR, CORRETORAS_VENDEDOR } from '@/lib/types'
import { Plus, Search, Eye, Pencil, UserX } from 'lucide-react'

interface Props {
  vendedores: Vendedor[]
}

const selectCls = 'border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2'
const selectStyle = { borderColor: '#e8e4dd' }

export default function GestaoClient({ vendedores: inicial }: Props) {
  const [lista, setLista]               = useState(inicial)
  const [busca, setBusca]               = useState('')
  const [filtroTipo, setFiltroTipo]     = useState('')
  const [filtroCorretora, setFiltroCorretora] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)

  const supabase = createClient()

  const filtrados = useMemo(() => {
    return lista.filter(v => {
      if (busca) {
        const q = busca.toLowerCase()
        const match =
          v.nome.toLowerCase().includes(q) ||
          (v.cpf_cnpj ?? '').includes(q)
        if (!match) return false
      }
      if (filtroTipo && v.tipo !== filtroTipo) return false
      if (filtroCorretora && v.corretora !== filtroCorretora) return false
      if (filtroStatus === 'ativo' && !v.ativo) return false
      if (filtroStatus === 'inativo' && v.ativo) return false
      return true
    })
  }, [lista, busca, filtroTipo, filtroCorretora, filtroStatus])

  async function desativar(id: string) {
    await supabase.from('vendedores').update({ ativo: false }).eq('id', id)
    setLista(prev => prev.map(v => v.id === id ? { ...v, ativo: false } : v))
    setConfirmandoId(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Gestão</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>
            Vendedores e corretores cadastrados
          </p>
        </div>
        <Link
          href="/gestao/novo"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#2d1f4e' }}
        >
          <Plus size={16} />
          Novo Vendedor
        </Link>
      </div>

      {/* Filtros */}
      <div
        className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3"
        style={{ border: '1px solid #e8e4dd' }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#9a918a' }}
          />
          <input
            className="w-full border rounded-xl pl-9 pr-4 py-2 text-sm bg-white focus:outline-none focus:ring-2"
            style={{ borderColor: '#e8e4dd' }}
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <select
          className={selectCls}
          style={selectStyle}
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {TIPOS_VENDEDOR.map(t => <option key={t}>{t}</option>)}
        </select>
        <select
          className={selectCls}
          style={selectStyle}
          value={filtroCorretora}
          onChange={e => setFiltroCorretora(e.target.value)}
        >
          <option value="">Todas as corretoras</option>
          {CORRETORAS_VENDEDOR.map(c => <option key={c}>{c}</option>)}
        </select>
        <select
          className={selectCls}
          style={selectStyle}
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4dd' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f4f1ec', borderBottom: '1px solid #e8e4dd' }}>
                {['Nome', 'Tipo', 'Corretora', 'Status', 'Telefone', ''].map(h => (
                  <th
                    key={h}
                    className={`px-4 py-3 font-semibold ${h === '' ? 'text-right' : 'text-left'}`}
                    style={{ color: '#2d1f4e' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-sm"
                    style={{ color: '#9a918a' }}
                  >
                    Nenhum vendedor encontrado
                  </td>
                </tr>
              )}
              {filtrados.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f4f1ec' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#1a1a1a' }}>{v.nome}</td>
                  <td className="px-4 py-3" style={{ color: '#4a4a4a' }}>{v.tipo ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color: '#4a4a4a' }}>{v.corretora ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={v.ativo
                        ? { backgroundColor: '#dcfce7', color: '#15803d' }
                        : { backgroundColor: '#fee2e2', color: '#b91c1c' }
                      }
                    >
                      {v.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#4a4a4a' }}>{v.telefone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/gestao/${v.id}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title="Ver ficha"
                      >
                        <Eye size={15} style={{ color: '#2d1f4e' }} />
                      </Link>
                      <Link
                        href={`/gestao/${v.id}/editar`}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title="Editar"
                      >
                        <Pencil size={15} style={{ color: '#b89a6a' }} />
                      </Link>
                      {confirmandoId === v.id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => desativar(v.id)}
                            className="px-2 py-1 text-xs rounded-lg text-white"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmandoId(null)}
                            className="px-2 py-1 text-xs rounded-lg"
                            style={{ backgroundColor: '#e8e4dd', color: '#4a4a4a' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmandoId(v.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100"
                          title="Desativar"
                          disabled={!v.ativo}
                        >
                          <UserX
                            size={15}
                            style={{ color: v.ativo ? '#ef4444' : '#d1d5db' }}
                          />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/GestaoClient.tsx
git commit -m "feat: GestaoClient — tabela de vendedores com filtros e badges"
```

---

## Task 4: Página principal /gestao

**Files:**
- Create: `src/app/(protected)/gestao/page.tsx`

- [ ] **Criar diretório e ficheiro**

```bash
mkdir -p "src/app/(protected)/gestao"
```

- [ ] **Criar page.tsx**

```tsx
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
```

- [ ] **Commit**

```bash
git add "src/app/(protected)/gestao/page.tsx"
git commit -m "feat: /gestao — página principal com lista de vendedores"
```

---

## Task 5: VendedorForm — formulário de criação e edição

**Files:**
- Create: `src/components/VendedorForm.tsx`

- [ ] **Criar o componente**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Vendedor,
  VendedorInsert,
  TIPOS_VENDEDOR,
  CORRETORAS_VENDEDOR,
  FORMAS_REPASSE,
  REPASSE_SOBRE,
} from '@/lib/types'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  vendedor?: Vendedor
}

const inputCls =
  'w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow'
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }

function Secao({
  titulo,
  index,
  aberta,
  onToggle,
  children,
}: {
  titulo: string
  index: number
  aberta: boolean
  onToggle: (i: number) => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #e8e4dd' }}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        onClick={() => onToggle(index)}
      >
        <span className="text-sm font-bold" style={{ color: '#2d1f4e' }}>{titulo}</span>
        {aberta
          ? <ChevronUp size={16} style={{ color: '#2d1f4e' }} />
          : <ChevronDown size={16} style={{ color: '#9a918a' }} />
        }
      </button>
      {aberta && (
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {children}
        </div>
      )}
    </div>
  )
}

export default function VendedorForm({ vendedor }: Props) {
  const editando = !!vendedor

  // Dados pessoais
  const [nome, setNome]                           = useState(vendedor?.nome ?? '')
  const [cpfCnpj, setCpfCnpj]                     = useState(vendedor?.cpf_cnpj ?? '')
  const [rg, setRg]                               = useState(vendedor?.rg ?? '')
  const [dataNascimento, setDataNascimento]       = useState(vendedor?.data_nascimento ?? '')
  const [sexo, setSexo]                           = useState(vendedor?.sexo ?? '')
  const [telefone, setTelefone]                   = useState(vendedor?.telefone ?? '')
  const [email, setEmail]                         = useState(vendedor?.email ?? '')
  const [enderecoCep, setEnderecoCep]             = useState(vendedor?.endereco_cep ?? '')
  const [enderecoLogradouro, setEnderecoLogradouro] = useState(vendedor?.endereco_logradouro ?? '')
  const [enderecoNumero, setEnderecoNumero]       = useState(vendedor?.endereco_numero ?? '')
  const [enderecoComplemento, setEnderecoComplemento] = useState(vendedor?.endereco_complemento ?? '')
  const [enderecoBairro, setEnderecoBairro]       = useState(vendedor?.endereco_bairro ?? '')
  const [enderecoCidade, setEnderecoCidade]       = useState(vendedor?.endereco_cidade ?? '')
  const [enderecoEstado, setEnderecoEstado]       = useState(vendedor?.endereco_estado ?? '')

  // Dados profissionais
  const [tipo, setTipo]               = useState(vendedor?.tipo ?? '')
  const [corretora, setCorretora]     = useState(vendedor?.corretora ?? '')
  const [dataAdmissao, setDataAdmissao] = useState(vendedor?.data_admissao ?? '')
  const [dataDemissao, setDataDemissao] = useState(vendedor?.data_demissao ?? '')
  const [susep, setSusep]             = useState(vendedor?.susep ?? '')
  const [ativo, setAtivo]             = useState(vendedor?.ativo ?? true)

  // Repasse
  const [percentualRepasse, setPercentualRepasse]   = useState(vendedor?.percentual_repasse?.toString() ?? '')
  const [formaRepasse, setFormaRepasse]             = useState(vendedor?.forma_repasse ?? '')
  const [repasseSobre, setRepasseSobre]             = useState(vendedor?.repasse_sobre ?? '')
  const [temVitalicio, setTemVitalicio]             = useState(vendedor?.tem_vitalicio ?? false)
  const [percentualVitalicio, setPercentualVitalicio] = useState(vendedor?.percentual_vitalicio?.toString() ?? '')

  // Bancário
  const [banco, setBanco]         = useState(vendedor?.banco ?? '')
  const [agencia, setAgencia]     = useState(vendedor?.agencia ?? '')
  const [conta, setConta]         = useState(vendedor?.conta ?? '')
  const [tipoConta, setTipoConta] = useState(vendedor?.tipo_conta ?? '')
  const [pix, setPix]             = useState(vendedor?.pix ?? '')

  // Observações
  const [observacoes, setObservacoes] = useState(vendedor?.observacoes ?? '')

  // UI
  const [secaoAberta, setSecaoAberta] = useState(0)
  const [erro, setErro]               = useState('')
  const [loading, setLoading]         = useState(false)

  const router = useRouter()
  const supabase = createClient()

  function toggleSecao(i: number) {
    setSecaoAberta(prev => (prev === i ? -1 : i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setErro('Nome é obrigatório'); return }
    setLoading(true)
    setErro('')

    const payload: VendedorInsert = {
      nome: nome.trim(),
      ativo,
      cpf_cnpj:              cpfCnpj || null,
      rg:                    rg || null,
      data_nascimento:       dataNascimento || null,
      sexo:                  sexo || null,
      telefone:              telefone || null,
      email:                 email || null,
      endereco_cep:          enderecoCep || null,
      endereco_logradouro:   enderecoLogradouro || null,
      endereco_numero:       enderecoNumero || null,
      endereco_complemento:  enderecoComplemento || null,
      endereco_bairro:       enderecoBairro || null,
      endereco_cidade:       enderecoCidade || null,
      endereco_estado:       enderecoEstado || null,
      tipo:                  tipo || null,
      corretora:             corretora || null,
      data_admissao:         dataAdmissao || null,
      data_demissao:         dataDemissao || null,
      susep:                 susep || null,
      percentual_repasse:    percentualRepasse ? parseFloat(percentualRepasse) : null,
      forma_repasse:         formaRepasse || null,
      repasse_sobre:         repasseSobre || null,
      tem_vitalicio:         temVitalicio,
      percentual_vitalicio:  percentualVitalicio ? parseFloat(percentualVitalicio) : null,
      banco:                 banco || null,
      agencia:               agencia || null,
      conta:                 conta || null,
      tipo_conta:            tipoConta || null,
      pix:                   pix || null,
      observacoes:           observacoes || null,
    }

    const { error } = editando
      ? await supabase.from('vendedores').update(payload).eq('id', vendedor!.id)
      : await supabase.from('vendedores').insert(payload)

    if (error) {
      setErro('Erro ao salvar: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/gestao')
    router.refresh()
  }

  const secaoProps = (i: number) => ({ index: i, aberta: secaoAberta === i, onToggle: toggleSecao })

  return (
    <form onSubmit={handleSubmit}>
      <Secao titulo="Dados Pessoais" {...secaoProps(0)}>
        <div className="md:col-span-2">
          <label className={labelCls} style={labelStyle}>Nome completo *</label>
          <input
            className={inputCls}
            style={inputStyle}
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>CPF / CNPJ</label>
          <input className={inputCls} style={inputStyle} value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>RG</label>
          <input className={inputCls} style={inputStyle} value={rg} onChange={e => setRg(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Data de nascimento</label>
          <input type="date" className={inputCls} style={inputStyle} value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Sexo</label>
          <select className={inputCls} style={inputStyle} value={sexo} onChange={e => setSexo(e.target.value)}>
            <option value="">Selecione</option>
            <option>Masculino</option>
            <option>Feminino</option>
            <option>Outro</option>
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Telefone / WhatsApp</label>
          <input className={inputCls} style={inputStyle} value={telefone} onChange={e => setTelefone(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>E-mail</label>
          <input type="email" className={inputCls} style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>CEP</label>
          <input className={inputCls} style={inputStyle} value={enderecoCep} onChange={e => setEnderecoCep(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} style={labelStyle}>Logradouro</label>
          <input className={inputCls} style={inputStyle} value={enderecoLogradouro} onChange={e => setEnderecoLogradouro(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Número</label>
          <input className={inputCls} style={inputStyle} value={enderecoNumero} onChange={e => setEnderecoNumero(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Complemento</label>
          <input className={inputCls} style={inputStyle} value={enderecoComplemento} onChange={e => setEnderecoComplemento(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Bairro</label>
          <input className={inputCls} style={inputStyle} value={enderecoBairro} onChange={e => setEnderecoBairro(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Cidade</label>
          <input className={inputCls} style={inputStyle} value={enderecoCidade} onChange={e => setEnderecoCidade(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Estado (UF)</label>
          <input className={inputCls} style={inputStyle} value={enderecoEstado} onChange={e => setEnderecoEstado(e.target.value)} maxLength={2} placeholder="SP" />
        </div>
      </Secao>

      <Secao titulo="Dados Profissionais" {...secaoProps(1)}>
        <div>
          <label className={labelCls} style={labelStyle}>Tipo</label>
          <select className={inputCls} style={inputStyle} value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="">Selecione</option>
            {TIPOS_VENDEDOR.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Corretora vinculada</label>
          <select className={inputCls} style={inputStyle} value={corretora} onChange={e => setCorretora(e.target.value)}>
            <option value="">Selecione</option>
            {CORRETORAS_VENDEDOR.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Data de admissão</label>
          <input type="date" className={inputCls} style={inputStyle} value={dataAdmissao} onChange={e => setDataAdmissao(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Data de demissão</label>
          <input type="date" className={inputCls} style={inputStyle} value={dataDemissao} onChange={e => setDataDemissao(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>SUSEP</label>
          <input className={inputCls} style={inputStyle} value={susep} onChange={e => setSusep(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Status</label>
          <select
            className={inputCls}
            style={inputStyle}
            value={ativo ? 'ativo' : 'inativo'}
            onChange={e => setAtivo(e.target.value === 'ativo')}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </Secao>

      <Secao titulo="Configuração de Repasse" {...secaoProps(2)}>
        <div>
          <label className={labelCls} style={labelStyle}>Percentual de repasse (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            className={inputCls}
            style={inputStyle}
            value={percentualRepasse}
            onChange={e => setPercentualRepasse(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Forma de repasse</label>
          <select className={inputCls} style={inputStyle} value={formaRepasse} onChange={e => setFormaRepasse(e.target.value)}>
            <option value="">Selecione</option>
            {FORMAS_REPASSE.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} style={labelStyle}>Repasse sobre</label>
          <select className={inputCls} style={inputStyle} value={repasseSobre} onChange={e => setRepasseSobre(e.target.value)}>
            <option value="">Selecione</option>
            {REPASSE_SOBRE.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Tem vitalício</label>
          <select
            className={inputCls}
            style={inputStyle}
            value={temVitalicio ? 'sim' : 'nao'}
            onChange={e => setTemVitalicio(e.target.value === 'sim')}
          >
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </select>
        </div>
        {temVitalicio && (
          <div>
            <label className={labelCls} style={labelStyle}>Percentual do vitalício (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className={inputCls}
              style={inputStyle}
              value={percentualVitalicio}
              onChange={e => setPercentualVitalicio(e.target.value)}
            />
          </div>
        )}
      </Secao>

      <Secao titulo="Informações Bancárias" {...secaoProps(3)}>
        <div>
          <label className={labelCls} style={labelStyle}>Banco</label>
          <input className={inputCls} style={inputStyle} value={banco} onChange={e => setBanco(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Agência</label>
          <input className={inputCls} style={inputStyle} value={agencia} onChange={e => setAgencia(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Conta</label>
          <input className={inputCls} style={inputStyle} value={conta} onChange={e => setConta(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Tipo de conta</label>
          <select className={inputCls} style={inputStyle} value={tipoConta} onChange={e => setTipoConta(e.target.value)}>
            <option value="">Selecione</option>
            <option>Corrente</option>
            <option>Poupança</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} style={labelStyle}>PIX</label>
          <input className={inputCls} style={inputStyle} value={pix} onChange={e => setPix(e.target.value)} />
        </div>
      </Secao>

      <Secao titulo="Observações" {...secaoProps(4)}>
        <div className="md:col-span-2">
          <textarea
            className={inputCls}
            style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            placeholder="Anotações sobre este vendedor..."
          />
        </div>
      </Secao>

      {erro && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
        >
          {erro}
        </div>
      )}

      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push('/gestao')}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: '#e8e4dd', color: '#4a4a4a' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#2d1f4e' }}
        >
          {loading ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar vendedor'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/VendedorForm.tsx
git commit -m "feat: VendedorForm — formulário em accordion com 5 secções"
```

---

## Task 6: Página /gestao/novo

**Files:**
- Create: `src/app/(protected)/gestao/novo/page.tsx`

- [ ] **Criar diretório e ficheiro**

```bash
mkdir -p "src/app/(protected)/gestao/novo"
```

- [ ] **Criar page.tsx**

```tsx
import VendedorForm from '@/components/VendedorForm'

export default function NovoVendedorPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Novo Vendedor</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>
          Cadastre um vendedor ou corretor
        </p>
      </div>
      <VendedorForm />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add "src/app/(protected)/gestao/novo/page.tsx"
git commit -m "feat: /gestao/novo — página de criação de vendedor"
```

---

## Task 7: Página /gestao/[id]/editar

**Files:**
- Create: `src/app/(protected)/gestao/[id]/editar/page.tsx`

- [ ] **Criar diretórios e ficheiro**

```bash
mkdir -p "src/app/(protected)/gestao/[id]/editar"
```

- [ ] **Criar page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import VendedorForm from '@/components/VendedorForm'

export default async function EditarVendedorPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: vendedor } = await supabase
    .from('vendedores')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!vendedor) notFound()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Editar Vendedor</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>{vendedor.nome}</p>
      </div>
      <VendedorForm vendedor={vendedor} />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add "src/app/(protected)/gestao/[id]/editar/page.tsx"
git commit -m "feat: /gestao/[id]/editar — página de edição de vendedor"
```

---

## Task 8: FichaVendedor — detalhe e produção

**Files:**
- Create: `src/components/FichaVendedor.tsx`

- [ ] **Criar o componente**

```tsx
'use client'

import Link from 'next/link'
import { Vendedor, Venda, Comissao } from '@/lib/types'
import { Pencil, ArrowLeft } from 'lucide-react'

interface Props {
  vendedor: Vendedor
  vendas: Venda[]
  comissoes: Comissao[]
}

const cardCls = 'bg-white rounded-2xl p-6 mb-4'
const cardStyle = { border: '1px solid #e8e4dd' }
const sectionTitleCls = 'text-sm font-bold mb-4 pb-2 border-b'
const sectionTitleStyle = { color: '#2d1f4e', borderColor: '#e8e4dd' }

function Campo({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold" style={{ color: '#9a918a' }}>{label}</p>
      <p className="text-sm mt-0.5" style={{ color: '#1a1a1a' }}>{value ?? '—'}</p>
    </div>
  )
}

export default function FichaVendedor({ vendedor, vendas, comissoes }: Props) {
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const vendasMes     = vendas.filter(v => new Date(v.data_venda) >= inicioMes)
  const producaoMes   = vendasMes.reduce((acc, v) => acc + v.valor_plano, 0)
  const producaoTotal = vendas.reduce((acc, v) => acc + v.valor_plano, 0)
  const comissoesPagas     = comissoes
    .filter(c => c.status_vendedor === 'Recebido')
    .reduce((acc, c) => acc + c.valor_vendedor, 0)
  const comissoesPendentes = comissoes
    .filter(c => c.status_vendedor === 'Pendente')
    .reduce((acc, c) => acc + c.valor_vendedor, 0)

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/gestao"
            className="p-2 rounded-xl hover:bg-white"
            style={{ border: '1px solid #e8e4dd' }}
          >
            <ArrowLeft size={16} style={{ color: '#2d1f4e' }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>
              {vendedor.nome}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {vendedor.tipo && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#ede9fe', color: '#6d28d9' }}
                >
                  {vendedor.tipo}
                </span>
              )}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={
                  vendedor.ativo
                    ? { backgroundColor: '#dcfce7', color: '#15803d' }
                    : { backgroundColor: '#fee2e2', color: '#b91c1c' }
                }
              >
                {vendedor.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/gestao/${vendedor.id}/editar`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#2d1f4e' }}
        >
          <Pencil size={14} />
          Editar
        </Link>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Produção do mês',      value: fmt(producaoMes) },
          { label: 'Produção total',        value: fmt(producaoTotal) },
          { label: 'Comissões pagas',       value: fmt(comissoesPagas) },
          { label: 'Comissões pendentes',   value: fmt(comissoesPendentes) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-4"
            style={{ border: '1px solid #e8e4dd' }}
          >
            <p className="text-xs font-semibold" style={{ color: '#9a918a' }}>{label}</p>
            <p className="text-lg font-bold mt-1" style={{ color: '#2d1f4e' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Dados pessoais */}
      <div className={cardCls} style={cardStyle}>
        <p className={sectionTitleCls} style={sectionTitleStyle}>Dados Pessoais</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Campo label="CPF / CNPJ"        value={vendedor.cpf_cnpj} />
          <Campo label="RG"                value={vendedor.rg} />
          <Campo label="Data de nascimento" value={vendedor.data_nascimento} />
          <Campo label="Sexo"              value={vendedor.sexo} />
          <Campo label="Telefone"          value={vendedor.telefone} />
          <Campo label="E-mail"            value={vendedor.email} />
          <Campo label="CEP"               value={vendedor.endereco_cep} />
          <Campo label="Logradouro"        value={vendedor.endereco_logradouro} />
          <Campo label="Número"            value={vendedor.endereco_numero} />
          <Campo label="Complemento"       value={vendedor.endereco_complemento} />
          <Campo label="Bairro"            value={vendedor.endereco_bairro} />
          <Campo label="Cidade"            value={vendedor.endereco_cidade} />
          <Campo label="Estado"            value={vendedor.endereco_estado} />
        </div>
      </div>

      {/* Dados profissionais */}
      <div className={cardCls} style={cardStyle}>
        <p className={sectionTitleCls} style={sectionTitleStyle}>Dados Profissionais</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Campo label="Tipo"             value={vendedor.tipo} />
          <Campo label="Corretora"        value={vendedor.corretora} />
          <Campo label="Data de admissão" value={vendedor.data_admissao} />
          <Campo label="Data de demissão" value={vendedor.data_demissao} />
          <Campo label="SUSEP"            value={vendedor.susep} />
        </div>
      </div>

      {/* Repasse */}
      <div className={cardCls} style={cardStyle}>
        <p className={sectionTitleCls} style={sectionTitleStyle}>Configuração de Repasse</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Campo
            label="Percentual de repasse"
            value={vendedor.percentual_repasse != null ? `${vendedor.percentual_repasse}%` : null}
          />
          <Campo label="Forma de repasse" value={vendedor.forma_repasse} />
          <Campo label="Repasse sobre"    value={vendedor.repasse_sobre} />
          <Campo label="Tem vitalício"    value={vendedor.tem_vitalicio ? 'Sim' : 'Não'} />
          {vendedor.tem_vitalicio && (
            <Campo
              label="Percentual do vitalício"
              value={vendedor.percentual_vitalicio != null ? `${vendedor.percentual_vitalicio}%` : null}
            />
          )}
        </div>
      </div>

      {/* Bancário */}
      <div className={cardCls} style={cardStyle}>
        <p className={sectionTitleCls} style={sectionTitleStyle}>Informações Bancárias</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Campo label="Banco"        value={vendedor.banco} />
          <Campo label="Agência"      value={vendedor.agencia} />
          <Campo label="Conta"        value={vendedor.conta} />
          <Campo label="Tipo de conta" value={vendedor.tipo_conta} />
          <Campo label="PIX"          value={vendedor.pix} />
        </div>
      </div>

      {/* Observações */}
      {vendedor.observacoes && (
        <div className={cardCls} style={cardStyle}>
          <p className={sectionTitleCls} style={sectionTitleStyle}>Observações</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: '#4a4a4a' }}>
            {vendedor.observacoes}
          </p>
        </div>
      )}

      {/* Histórico de produção */}
      <div className={cardCls} style={cardStyle}>
        <p className={sectionTitleCls} style={sectionTitleStyle}>
          Histórico de Produção ({vendas.length} venda{vendas.length !== 1 ? 's' : ''})
        </p>
        {vendas.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: '#9a918a' }}>
            Nenhuma venda registada
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #e8e4dd' }}>
                  {['Cliente', 'Operadora', 'Valor', 'Data', 'Status'].map(h => (
                    <th
                      key={h}
                      className="text-left py-2 pr-4 font-semibold"
                      style={{ color: '#2d1f4e' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendas.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f4f1ec' }}>
                    <td className="py-2 pr-4" style={{ color: '#1a1a1a' }}>{v.cliente_nome}</td>
                    <td className="py-2 pr-4" style={{ color: '#4a4a4a' }}>{v.operadora}</td>
                    <td className="py-2 pr-4" style={{ color: '#4a4a4a' }}>{fmt(v.valor_plano)}</td>
                    <td className="py-2 pr-4" style={{ color: '#4a4a4a' }}>
                      {new Date(v.data_venda + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={
                          v.status === 'Ativo'
                            ? { backgroundColor: '#dcfce7', color: '#15803d' }
                            : { backgroundColor: '#fee2e2', color: '#b91c1c' }
                        }
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/FichaVendedor.tsx
git commit -m "feat: FichaVendedor — cards de dados e histórico de produção"
```

---

## Task 9: Página /gestao/[id]

**Files:**
- Create: `src/app/(protected)/gestao/[id]/page.tsx`

- [ ] **Criar page.tsx** (na mesma pasta já criada para /editar)

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FichaVendedor from '@/components/FichaVendedor'

export default async function FichaVendedorPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: vendedor } = await supabase
    .from('vendedores')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!vendedor) notFound()

  const { data: vendas } = await supabase
    .from('vendas')
    .select('*')
    .eq('vendedor', vendedor.nome)
    .order('data_venda', { ascending: false })

  const vendaIds = (vendas ?? []).map(v => v.id)
  const { data: comissoes } = vendaIds.length > 0
    ? await supabase.from('comissoes').select('*').in('venda_id', vendaIds)
    : { data: [] }

  return (
    <div className="p-6 md:p-8">
      <FichaVendedor
        vendedor={vendedor}
        vendas={vendas ?? []}
        comissoes={comissoes ?? []}
      />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add "src/app/(protected)/gestao/[id]/page.tsx"
git commit -m "feat: /gestao/[id] — ficha do vendedor com produção e comissões"
```

---

## Task 10: Verificação final

- [ ] **Iniciar o servidor de desenvolvimento**

```bash
npm run dev
```

- [ ] **Verificar no browser:**
  1. `/gestao` — tabela carrega, filtros funcionam, badges corretos
  2. `/gestao/novo` — formulário abre, accordion funciona, cadastro salva e redireciona
  3. `/gestao/[id]` — ficha mostra dados e totais
  4. `/gestao/[id]/editar` — dados carregam preenchidos, edição salva
  5. `/crm` → formulário de lead — dropdown de vendedor inclui o novo cadastro
  6. `/clientes/novo` — dropdown de vendedor inclui o novo cadastro

- [ ] **Commit final se tudo OK**

```bash
git add .
git commit -m "feat: módulo Gestão — cadastro e gestão de vendedores/corretores"
```
