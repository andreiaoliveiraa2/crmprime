# Melhorias do Módulo Financeiro — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar clientes→produção automaticamente por status, adicionar campo Empresa em toda a camada financeira, e separar comissão corretora/vendedor na UI.

**Architecture:** A sincronização clientes→vendas já existe parcialmente em `ClienteFormPosVenda.tsx`; o plano corrige o critério (status=Ativo) e adiciona o campo empresa. Migrations Supabase adicionam a coluna `empresa` nas tabelas `vendas`, `comissoes` e `contas`. UI recebe filtros e colunas adicionais.

**Tech Stack:** Next.js 16 App Router, Supabase (client + server), React hooks, TypeScript, Tailwind

---

## Arquivos modificados

| Arquivo | O que muda |
|---------|-----------|
| `src/lib/types.ts` | + constante `EMPRESAS`, tipo `Empresa`, campo `empresa` em `Venda`/`Comissao`/`Conta` |
| `src/components/ClienteFormPosVenda.tsx` | Corrigir critério de sync (status=Ativo), cancelado cancela venda, empresa propagada para venda e comissões |
| `src/components/ProducaoTab.tsx` | + filtro empresa |
| `src/components/ContasTab.tsx` | + campo empresa no ContaModal, + filtro empresa |
| `src/components/ComissoesTab.tsx` | + colunas Corretora/Vendedor separadas, + filtro empresa, + cards separados |
| `src/components/RelatoriosTab.tsx` | + filtro empresa |

---

## Task 1: Types — EMPRESAS, Empresa, campo empresa

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Passo 1: Adicionar constante e tipo Empresa**

Em `src/lib/types.ts`, logo após a linha `export const NIVEIS_VENDEDOR`:

```ts
export const EMPRESAS = ['A2 Prime', 'A2 Corretora', 'MEI Alessandro'] as const
export type Empresa = typeof EMPRESAS[number]
```

- [ ] **Passo 2: Adicionar campo `empresa` em Venda**

Localizar a interface `Venda` e adicionar após `criado_em`:

```ts
export interface Venda {
  id: string
  cliente_id: string | null
  cliente_nome: string
  operadora: string
  valor_plano: number
  vendedor: string
  data_venda: string
  status: 'Ativo' | 'Cancelado'
  origem: 'cliente' | 'manual'
  empresa: string | null
  criado_em: string
}
```

- [ ] **Passo 3: Adicionar campo `empresa` em Comissao**

```ts
export interface Comissao {
  id: string
  venda_id: string
  tipo: 'parcela' | 'vitalicio'
  numero_parcela: number | null
  valor_bruto: number
  valor_empresa: number
  valor_vendedor: number
  status_empresa: 'Pendente' | 'Recebido'
  status_vendedor: 'Pendente' | 'Recebido'
  data_prevista: string
  data_recebida_empresa: string | null
  data_recebida_vendedor: string | null
  empresa: string | null
  criado_em: string
}
```

- [ ] **Passo 4: Adicionar campo `empresa` em Conta**

```ts
export interface Conta {
  id: string
  tipo: 'receber' | 'pagar'
  descricao: string
  valor: number
  vencimento: string
  status: 'Pendente' | 'Recebido' | 'Pago'
  observacoes: string | null
  empresa: string | null
  criado_em: string
}
```

`ContaInsert` já é `Omit<Conta, 'id' | 'criado_em'>`, então não precisa de alteração adicional.

- [ ] **Passo 5: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: types — EMPRESAS, campo empresa em Venda/Comissao/Conta"
```

---

## Task 2: Migration Supabase (passo manual)

**Atenção:** Este passo é executado no painel do Supabase (SQL Editor), não no código.

- [ ] **Passo 1: Abrir o SQL Editor no Supabase e executar**

```sql
ALTER TABLE vendas    ADD COLUMN IF NOT EXISTS empresa text;
ALTER TABLE comissoes ADD COLUMN IF NOT EXISTS empresa text;
ALTER TABLE contas    ADD COLUMN IF NOT EXISTS empresa text;
```

- [ ] **Passo 2: Verificar no Table Editor que as colunas apareceram**

Confirmar que `vendas`, `comissoes` e `contas` têm a coluna `empresa` (nullable, text).

---

## Task 3: ClienteFormPosVenda — sync correto + empresa

**Files:**
- Modify: `src/components/ClienteFormPosVenda.tsx`

A lógica de sync já existe mas tem dois problemas: (1) não verifica `status === 'Ativo'`; (2) não propaga `empresa`; (3) não cancela a venda quando status = 'Cancelado'.

- [ ] **Passo 1: Atualizar assinatura de `gerarComissoes` para receber `empresa`**

Localizar a linha `async function gerarComissoes(vendaId: string, dataVendaFinal: string, payloadLocal: ClienteInsert)` e alterar para:

```ts
async function gerarComissoes(vendaId: string, dataVendaFinal: string, payloadLocal: ClienteInsert, empresa: string | null) {
```

- [ ] **Passo 2: Propagar `empresa` em cada comissão gerada (bloco de parcelas manuais)**

Dentro do `if (resultado)`, alterar o map das comissões do `calcularComissoes`:

```ts
if (resultado) {
  await supabase.from('comissoes').delete().eq('venda_id', vendaId).eq('tipo', 'parcela')
  await supabase.from('comissoes').delete().eq('venda_id', vendaId).eq('tipo', 'vitalicio')
  const todas = [
    ...resultado.parcelas.map((c: object) => ({ ...c, empresa })),
    ...resultado.vitalicios.map((c: object) => ({ ...c, empresa })),
  ]
  if (todas.length > 0) await supabase.from('comissoes').insert(todas)
```

- [ ] **Passo 3: Propagar `empresa` nas comissões geradas por regra (bloco `else if`)**

No loop que monta o array `comissoes`, cada `push` deve incluir `empresa`:

```ts
comissoes.push({
  venda_id: vendaId, tipo: 'parcela', numero_parcela: i,
  valor_bruto: valorBruto,
  valor_empresa: valorBruto * (pctEmp / 100),
  valor_vendedor: valorBruto * (pctVend / 100),
  status_empresa: 'Pendente', status_vendedor: 'Pendente',
  data_prevista: d.toISOString().split('T')[0],
  data_recebida_empresa: null, data_recebida_vendedor: null,
  empresa,
})
```

E no push do vitalício dentro do mesmo bloco:

```ts
comissoes.push({
  venda_id: vendaId, tipo: 'vitalicio', numero_parcela: null,
  valor_bruto: valorBruto,
  valor_empresa: valorBruto * ((ultima?.percentual_empresa ?? 50) / 100),
  valor_vendedor: 0,
  status_empresa: 'Pendente', status_vendedor: 'Pendente',
  data_prevista: d.toISOString().split('T')[0],
  data_recebida_empresa: null, data_recebida_vendedor: null,
  empresa,
})
```

> Nota: `valor_vendedor: 0` no vitalício — vitalício é exclusivo da corretora.

- [ ] **Passo 4: Corrigir o bloco de edição (status Ativo + empresa + Cancelado)**

Localizar o bloco que começa com `if (editando)` e substituir o trecho de sync de vendas por:

```ts
if (editando) {
  const { error } = await supabase.from('clientes').update(payload).eq('id', cliente.id)
  if (error) { setErro(`Erro: ${error.message}`); setLoading(false); return }

  const empresa = corretoraResponsavel.trim() || null

  if (status === 'Cancelado') {
    // Se cancelado, atualizar venda existente para Cancelado
    await supabase
      .from('vendas')
      .update({ status: 'Cancelado' })
      .eq('cliente_id', cliente.id)
      .eq('origem', 'cliente')
  } else if (status === 'Ativo' && payload.valor_plano && payload.operadora) {
    // Ativo: criar ou atualizar venda e comissões
    const { data: vendaExistente } = await supabase
      .from('vendas')
      .select('id')
      .eq('cliente_id', cliente.id)
      .eq('origem', 'cliente')
      .maybeSingle()

    let vendaId: string | null = null
    if (vendaExistente) {
      await supabase.from('vendas').update({
        cliente_nome: payload.nome,
        operadora: payload.operadora,
        valor_plano: payload.valor_plano,
        vendedor: payload.vendedor ?? '',
        data_venda: payload.data_venda ?? new Date().toISOString().split('T')[0],
        status: 'Ativo',
        empresa,
      }).eq('id', vendaExistente.id)
      vendaId = vendaExistente.id
    } else {
      const { data: novaVendaUpdate } = await supabase.from('vendas').insert({
        cliente_id: cliente.id,
        cliente_nome: payload.nome,
        operadora: payload.operadora,
        valor_plano: payload.valor_plano,
        vendedor: payload.vendedor ?? '',
        data_venda: payload.data_venda ?? new Date().toISOString().split('T')[0],
        status: 'Ativo',
        origem: 'cliente',
        empresa,
      }).select('id').single()
      vendaId = novaVendaUpdate?.id ?? null
    }
    if (vendaId) {
      const dvFinal = payload.data_venda ?? new Date().toISOString().split('T')[0]
      await gerarComissoes(vendaId, dvFinal, payload, empresa)
    }
  }
```

- [ ] **Passo 5: Corrigir o bloco de criação (status Ativo + empresa)**

Localizar o bloco `else` (criação de novo cliente) e substituir o trecho de sync:

```ts
} else {
  const { data: novoCliente, error } = await supabase.from('clientes').insert(payload).select().single()
  if (error) { setErro(`Erro: ${error.message}`); setLoading(false); return }

  const empresa = corretoraResponsavel.trim() || null

  if (novoCliente && status === 'Ativo' && payload.valor_plano && payload.operadora) {
    const { data: novaVenda } = await supabase.from('vendas').insert({
      cliente_id: novoCliente.id,
      cliente_nome: payload.nome,
      operadora: payload.operadora,
      valor_plano: payload.valor_plano,
      vendedor: payload.vendedor ?? '',
      data_venda: payload.data_venda ?? new Date().toISOString().split('T')[0],
      status: 'Ativo',
      origem: 'cliente',
      empresa,
    }).select('id').single()
    if (novaVenda) {
      const dvFinal = payload.data_venda ?? new Date().toISOString().split('T')[0]
      await gerarComissoes(novaVenda.id, dvFinal, payload, empresa)
    }
  }
}
```

- [ ] **Passo 6: Commit**

```bash
git add src/components/ClienteFormPosVenda.tsx
git commit -m "feat: ClienteFormPosVenda — sync empresa, status Ativo/Cancelado correto"
```

---

## Task 4: ProducaoTab — filtro empresa

**Files:**
- Modify: `src/components/ProducaoTab.tsx`

- [ ] **Passo 1: Adicionar import de EMPRESAS**

No topo do arquivo, localizar:
```ts
import { Venda, Comissao, Conta } from '@/lib/types'
```
Alterar para:
```ts
import { Venda, Comissao, Conta, EMPRESAS } from '@/lib/types'
```

- [ ] **Passo 2: Adicionar estado do filtro**

Logo após `const [dataFim, setDataFim] = useState('')`, adicionar:
```ts
const [filtroEmpresa, setFiltroEmpresa] = useState('')
```

- [ ] **Passo 3: Adicionar empresa ao filtro de vendas**

Na função `vendasFiltradas`, logo após `if (dataFim && v.data_venda > dataFim) return false`, adicionar:
```ts
if (filtroEmpresa && v.empresa !== filtroEmpresa) return false
```

Atualizar o array de dependências do `useMemo` para incluir `filtroEmpresa`.

- [ ] **Passo 4: Adicionar select empresa no Filter Bar**

Na seção `{/* Filter Bar */}`, logo antes do select de operadoras, adicionar:
```tsx
<select
  value={filtroEmpresa}
  onChange={e => setFiltroEmpresa(e.target.value)}
  className={selectCls}
  style={{ borderColor: '#e8e4dd', color: filtroEmpresa ? '#1a1a1a' : '#9a918a' }}
>
  <option value="">Todas as empresas</option>
  {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
</select>
```

- [ ] **Passo 5: Incluir `filtroEmpresa` na lógica de `temFiltro` e `limparFiltros`**

```ts
const temFiltro = filtroEmpresa || filtroOperadora || filtroVendedor || dataInicio || dataFim

function limparFiltros() {
  setFiltroEmpresa('')
  setFiltroOperadora('')
  setFiltroVendedor('')
  setDataInicio('')
  setDataFim('')
}
```

- [ ] **Passo 6: Commit**

```bash
git add src/components/ProducaoTab.tsx
git commit -m "feat: ProducaoTab — filtro por empresa"
```

---

## Task 5: ContasTab — campo empresa no modal + filtro

**Files:**
- Modify: `src/components/ContasTab.tsx`

- [ ] **Passo 1: Adicionar import de EMPRESAS**

```ts
import { Conta, ContaInsert, EMPRESAS } from '@/lib/types'
```

- [ ] **Passo 2: Adicionar estado `empresa` no ContaModal**

Dentro do componente `ContaModal`, após o estado `observacoes`:
```ts
const [empresa, setEmpresa] = useState<string>(contaEditando?.empresa ?? '')
```

- [ ] **Passo 3: Adicionar validação de empresa**

Em `handleSalvar`, após a validação de vencimento:
```ts
if (!empresa) { setErro('Empresa é obrigatória.'); return }
```

- [ ] **Passo 4: Incluir empresa no objeto `dados`**

```ts
const dados: ContaInsert = {
  tipo,
  descricao: descricao.trim(),
  valor: Number(valor),
  vencimento,
  status,
  observacoes: observacoes.trim() || null,
  empresa: empresa || null,
}
```

- [ ] **Passo 5: Adicionar campo empresa no formulário do modal**

No JSX do modal, após o campo de Observações, adicionar:
```tsx
<div>
  <label className="block text-xs font-medium text-gray-600 mb-1">Empresa *</label>
  <select
    value={empresa}
    onChange={e => setEmpresa(e.target.value)}
    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
    style={{ borderColor: '#e8e4dd' }}
  >
    <option value="">Selecionar empresa...</option>
    {EMPRESAS.map(emp => <option key={emp} value={emp}>{emp}</option>)}
  </select>
</div>
```

- [ ] **Passo 6: Adicionar estado e filtro empresa no ContasTab principal**

No componente `ContasTab`, adicionar estado:
```ts
const [filtroEmpresa, setFiltroEmpresa] = useState('')
```

Adicionar filtro na lista de contas (procurar onde `contas` é mapeada para a tabela e adicionar `.filter`):
```ts
const contasFiltradas = useMemo(() => {
  return contas.filter(c => {
    if (filtroEmpresa && c.empresa !== filtroEmpresa) return false
    return true
  })
}, [contas, filtroEmpresa])
```

Substituir `contas.map(...)` por `contasFiltradas.map(...)` na renderização da tabela.

- [ ] **Passo 7: Adicionar select empresa na barra de filtros de ContasTab**

Na seção de filtros do ContasTab, adicionar:
```tsx
<select
  value={filtroEmpresa}
  onChange={e => setFiltroEmpresa(e.target.value)}
  className="border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
  style={{ borderColor: '#e8e4dd', color: filtroEmpresa ? '#1a1a1a' : '#9a918a' }}
>
  <option value="">Todas as empresas</option>
  {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
</select>
```

- [ ] **Passo 8: Commit**

```bash
git add src/components/ContasTab.tsx
git commit -m "feat: ContasTab — campo empresa no modal, filtro por empresa"
```

---

## Task 6: ComissoesTab — colunas separadas + empresa + cards

**Files:**
- Modify: `src/components/ComissoesTab.tsx`

- [ ] **Passo 1: Adicionar import de EMPRESAS**

```ts
import { Comissao, Venda, RegraComissao, ParcelaRegra, EMPRESAS } from '@/lib/types'
```

- [ ] **Passo 2: Adicionar estado do filtro empresa**

Logo após a declaração de `filtroStatusVendedor`:
```ts
const [filtroEmpresa, setFiltroEmpresa] = useState('')
```

- [ ] **Passo 3: Substituir os dois cards de resumo por cards separados**

Localizar os cálculos `aReceber` e `totalRecebido` e substituir por:

```ts
const aReceberCorretora = useMemo(() =>
  comissoes
    .filter(c => c.status_empresa === 'Pendente')
    .reduce((sum, c) => sum + (c.valor_empresa ?? 0), 0),
  [comissoes]
)

const aPagarVendedores = useMemo(() =>
  comissoes
    .filter(c => c.status_vendedor === 'Pendente')
    .reduce((sum, c) => sum + (c.valor_vendedor ?? 0), 0),
  [comissoes]
)
```

- [ ] **Passo 4: Adicionar filtroEmpresa à lógica de filtragem**

Na função `comissoesFiltradas`, adicionar antes do `return true`:
```ts
if (filtroEmpresa && c.empresa !== filtroEmpresa) return false
```

Atualizar as dependências do `useMemo` para incluir `filtroEmpresa`.

- [ ] **Passo 5: Atualizar `temFiltro` e `limparFiltros`**

```ts
const temFiltro = filtroEmpresa || filtroOperadora || filtroVendedor || filtroTipo !== 'todos' || filtroStatusEmpresa !== 'todos' || filtroStatusVendedor !== 'todos' || dataInicio || dataFim

function limparFiltros() {
  setFiltroEmpresa('')
  setFiltroOperadora('')
  setFiltroVendedor('')
  setFiltroTipo('todos')
  setFiltroStatusEmpresa('todos')
  setFiltroStatusVendedor('todos')
  setDataInicio('')
  setDataFim('')
}
```

- [ ] **Passo 6: Adicionar select empresa na barra de filtros**

Antes do select de operadoras:
```tsx
<select
  value={filtroEmpresa}
  onChange={e => setFiltroEmpresa(e.target.value)}
  className={selectCls}
  style={{ borderColor: '#e8e4dd', color: filtroEmpresa ? '#1a1a1a' : '#9a918a' }}
>
  <option value="">Todas as empresas</option>
  {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
</select>
```

- [ ] **Passo 7: Substituir cards de resumo no JSX**

Localizar os cards de resumo (que mostram `aReceber` e `totalRecebido`) e substituir pelos dois cards separados:

```tsx
{/* Card — A receber (Corretora) */}
<div className="bg-white rounded-xl p-5 flex items-start gap-4" style={{ border: '1px solid #e8e4dd' }}>
  <div className="p-2 rounded-xl" style={{ backgroundColor: '#ede9f8' }}>
    <CheckCircle size={20} style={{ color: '#2d1f4e' }} />
  </div>
  <div>
    <p className="text-xs text-gray-500">A receber (Corretora)</p>
    <p className="text-xl font-bold mt-0.5" style={{ color: '#2d1f4e' }}>{formatBRL(aReceberCorretora)}</p>
  </div>
</div>

{/* Card — A pagar (Vendedores) */}
<div className="bg-white rounded-xl p-5 flex items-start gap-4" style={{ border: '1px solid #e8e4dd' }}>
  <div className="p-2 rounded-xl" style={{ backgroundColor: '#fef9e7' }}>
    <Clock size={20} style={{ color: '#b89a6a' }} />
  </div>
  <div>
    <p className="text-xs text-gray-500">A pagar (Vendedores)</p>
    <p className="text-xl font-bold mt-0.5" style={{ color: '#2d1f4e' }}>{formatBRL(aPagarVendedores)}</p>
  </div>
</div>
```

- [ ] **Passo 8: Substituir colunas da tabela — Corretora / Vendedor separadas**

Localizar o cabeçalho da tabela de comissões e substituir a coluna de valor única por duas colunas:

```tsx
<th className="text-left px-4 py-3 text-xs font-semibold text-white whitespace-nowrap">Corretora</th>
<th className="text-left px-4 py-3 text-xs font-semibold text-white whitespace-nowrap">Vendedor</th>
```

No corpo da tabela, substituir a célula de valor pela exibição separada:

```tsx
<td className="px-4 py-3 font-medium" style={{ color: '#15803d' }}>
  {formatBRL(c.valor_empresa)}
</td>
<td className="px-4 py-3">
  {c.tipo === 'vitalicio' ? (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#ede9f8', color: '#2d1f4e' }}>
      Vitalício · Só Corretora
    </span>
  ) : (
    <span style={{ color: '#b89a6a' }}>{formatBRL(c.valor_vendedor)}</span>
  )}
</td>
```

- [ ] **Passo 9: Commit**

```bash
git add src/components/ComissoesTab.tsx
git commit -m "feat: ComissoesTab — colunas Corretora/Vendedor, filtro empresa, cards separados"
```

---

## Task 7: RelatoriosTab — filtro empresa

**Files:**
- Modify: `src/components/RelatoriosTab.tsx`

- [ ] **Passo 1: Adicionar import de EMPRESAS**

```ts
import { Venda, Comissao, Conta, EMPRESAS } from '@/lib/types'
```

- [ ] **Passo 2: Adicionar estado do filtro**

Logo após `const [dataFim, setDataFim] = useState('')`:
```ts
const [filtroEmpresa, setFiltroEmpresa] = useState('')
```

- [ ] **Passo 3: Adicionar filtro empresa em `vendasPeriodo`**

Localizar (linha ~207):
```ts
const vendasPeriodo = useMemo(() => {
  if (!hasRange) return []
  return vendas.filter((v) => inRange(v.data_venda, rangeStart, rangeEnd))
}, [vendas, rangeStart, rangeEnd, hasRange])
```

Substituir por:
```ts
const vendasPeriodo = useMemo(() => {
  if (!hasRange) return []
  return vendas.filter((v) =>
    inRange(v.data_venda, rangeStart, rangeEnd) &&
    (!filtroEmpresa || v.empresa === filtroEmpresa)
  )
}, [vendas, rangeStart, rangeEnd, hasRange, filtroEmpresa])
```

- [ ] **Passo 4: Adicionar filtro empresa em `comissoesPeriodo`**

Localizar (linha ~233):
```ts
const comissoesPeriodo = useMemo(() => {
  if (!hasRange) return []
  return comissoes.filter((c) => {
    const venda = vendasMap.get(c.venda_id)
    if (!venda) return false
    return inRange(venda.data_venda, rangeStart, rangeEnd)
  })
}, [comissoes, vendasMap, rangeStart, rangeEnd, hasRange])
```

Substituir por:
```ts
const comissoesPeriodo = useMemo(() => {
  if (!hasRange) return []
  return comissoes.filter((c) => {
    const venda = vendasMap.get(c.venda_id)
    if (!venda) return false
    if (filtroEmpresa && c.empresa !== filtroEmpresa) return false
    return inRange(venda.data_venda, rangeStart, rangeEnd)
  })
}, [comissoes, vendasMap, rangeStart, rangeEnd, hasRange, filtroEmpresa])
```

- [ ] **Passo 5: Adicionar filtro empresa em `comissoesEmpresaPeriodo`**

Localizar (linha ~263):
```ts
const comissoesEmpresaPeriodo = useMemo(() => {
  if (!hasRange) return []
  return comissoes.filter(
    (c) =>
      c.status_empresa === 'Recebido' &&
      inRange(c.data_recebida_empresa, rangeStart, rangeEnd)
  )
}, [comissoes, rangeStart, rangeEnd, hasRange])
```

Substituir por:
```ts
const comissoesEmpresaPeriodo = useMemo(() => {
  if (!hasRange) return []
  return comissoes.filter(
    (c) =>
      c.status_empresa === 'Recebido' &&
      (!filtroEmpresa || c.empresa === filtroEmpresa) &&
      inRange(c.data_recebida_empresa, rangeStart, rangeEnd)
  )
}, [comissoes, rangeStart, rangeEnd, hasRange, filtroEmpresa])
```

- [ ] **Passo 6: Adicionar filtro empresa em `vitaliciosAtivos`**

Localizar (linha ~292):
```ts
const vitaliciosAtivos = useMemo(() => {
  return comissoes.filter((c) => c.tipo === 'vitalicio' && c.status_empresa === 'Pendente')
}, [comissoes])
```

Substituir por:
```ts
const vitaliciosAtivos = useMemo(() => {
  return comissoes.filter((c) =>
    c.tipo === 'vitalicio' &&
    c.status_empresa === 'Pendente' &&
    (!filtroEmpresa || c.empresa === filtroEmpresa)
  )
}, [comissoes, filtroEmpresa])
```

- [ ] **Passo 7: Adicionar filtro empresa em `comissoesPendentes` e `contasVencidas`**

Localizar `comissoesPendentes` (linha ~306) e substituir:
```ts
const comissoesPendentes = useMemo(() => {
  if (!hasRange) return []
  return comissoes.filter(
    (c) =>
      (c.status_empresa === 'Pendente' || c.status_vendedor === 'Pendente') &&
      (!filtroEmpresa || c.empresa === filtroEmpresa) &&
      inRange(c.data_prevista, rangeStart, rangeEnd)
  )
}, [comissoes, rangeStart, rangeEnd, hasRange, filtroEmpresa])
```

Localizar `contasVencidas` (linha ~315) e substituir:
```ts
const contasVencidas = useMemo(() => {
  const today = todayStr()
  return contas.filter((c) =>
    c.status === 'Pendente' &&
    c.vencimento < today &&
    (!filtroEmpresa || c.empresa === filtroEmpresa)
  )
}, [contas, filtroEmpresa])
```

- [ ] **Passo 8: Adicionar select empresa na barra de filtros do período**

No JSX, dentro do `div` com `{/* Period Filter */}`, após o toggle Mês/Período, adicionar:
```tsx
<select
  value={filtroEmpresa}
  onChange={e => setFiltroEmpresa(e.target.value)}
  className="border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
  style={{ borderColor: '#e8e4dd', color: filtroEmpresa ? '#1a1a1a' : '#9a918a' }}
>
  <option value="">Todas as empresas (consolidado)</option>
  {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
</select>
```

- [ ] **Passo 9: Commit**

```bash
git add src/components/RelatoriosTab.tsx
git commit -m "feat: RelatoriosTab — filtro por empresa (consolidado por padrão)"
```

---

## Task 8: Push final

- [ ] **Passo 1: Verificar que o servidor compila sem erros TypeScript**

```bash
npm run build
```

Esperado: sem erros de tipo. Se houver erros, corrigi-los antes de continuar.

- [ ] **Passo 2: Push**

```bash
git push
```
