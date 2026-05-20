# Cliente Campos Expandidos + Documentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expandir o formulário de cadastro de cliente com novos campos de plano/comercial, integração automática com o Financeiro via percentuais de comissão, e upload de documentos por tipo.

**Architecture:** Novos campos são adicionados à tabela `clientes` via migration SQL. A lógica de geração de comissões é extraída para `src/lib/calcularComissoes.ts` (função pura, testável). O formulário `ClienteFormPosVenda` recebe novos campos e chama a função. Documentos são gerenciados por dois novos componentes que usam Supabase Storage.

**Tech Stack:** Next.js 16, Supabase (banco + Storage), TypeScript, Tailwind CSS 4, Jest + React Testing Library.

---

## Task 1: SQL Migration — Novos campos em `clientes` + tabela `documentos_cliente`

**Files:**
- Create: `supabase/migrations/20260520_cliente_campos_extra.sql`

- [ ] **Step 1: Criar arquivo de migration**

Criar `supabase/migrations/20260520_cliente_campos_extra.sql` com o seguinte conteúdo:

```sql
-- Novos campos na tabela clientes

alter table clientes
  add column if not exists data_inicio_plano date,
  add column if not exists data_vencimento_plano date,
  add column if not exists coparticipacao boolean default false,
  add column if not exists tipo_acomodacao text,
  add column if not exists abrangencia text,
  add column if not exists carencia boolean default false,
  add column if not exists forma_pagamento text,
  add column if not exists dia_vencimento_boleto integer,
  add column if not exists corretora_responsavel text,
  add column if not exists percentual_comissao_corretora numeric,
  add column if not exists percentual_comissao_vendedor numeric,
  add column if not exists tem_vitalicio boolean default false,
  add column if not exists percentual_vitalicio numeric;

-- Tabela de documentos do cliente
create table if not exists documentos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  tipo text not null check (tipo in ('Contrato','Proposta','RG','CNH','Outro')),
  nome_arquivo text not null,
  storage_path text not null,
  tamanho_bytes integer,
  criado_em timestamptz not null default now()
);

-- Bucket de storage (ignorar erro se já existir)
insert into storage.buckets (id, name, public)
values ('clientes-documentos', 'clientes-documentos', false)
on conflict do nothing;
```

- [ ] **Step 2: Rodar no Supabase**

Copiar o conteúdo do arquivo e rodar no SQL Editor do Supabase. Confirmar que não há erros.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260520_cliente_campos_extra.sql
git commit -m "feat: migration — novos campos clientes + documentos_cliente + storage bucket"
```

---

## Task 2: Atualizar tipos TypeScript

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Adicionar campos ao interface `Cliente`**

No arquivo `src/lib/types.ts`, localizar o `interface Cliente` e adicionar os campos após `observacoes: string | null`:

```typescript
export interface Cliente {
  id: string
  nome: string
  cpf: string | null
  data_nascimento: string | null
  endereco: string | null
  contato: string | null
  email: string | null
  tipo_plano: string | null
  operadora: string | null
  administradora: string | null
  quantidade_vidas: number | null
  valor_plano: number | null
  numero_contrato: string | null
  data_venda: string | null
  data_implantacao: string | null
  status: StatusCliente
  vendedor: string | null
  comissao: number | null
  observacoes: string | null
  lead_id: string | null
  criado_em: string
  // Dados do Plano — novos
  data_inicio_plano: string | null
  data_vencimento_plano: string | null
  coparticipacao: boolean | null
  tipo_acomodacao: string | null
  abrangencia: string | null
  carencia: boolean | null
  // Dados Comerciais — novos
  forma_pagamento: string | null
  dia_vencimento_boleto: number | null
  corretora_responsavel: string | null
  percentual_comissao_corretora: number | null
  percentual_comissao_vendedor: number | null
  tem_vitalicio: boolean | null
  percentual_vitalicio: number | null
}
```

- [ ] **Step 2: Adicionar interface `DocumentoCliente` ao final do arquivo**

```typescript
export interface DocumentoCliente {
  id: string
  cliente_id: string
  tipo: 'Contrato' | 'Proposta' | 'RG' | 'CNH' | 'Outro'
  nome_arquivo: string
  storage_path: string
  tamanho_bytes: number | null
  criado_em: string
}
```

- [ ] **Step 3: Verificar build TypeScript**

```bash
npm run build 2>&1 | tail -15
```

Esperado: sem erros TypeScript (pode haver warnings de campos novos não usados ainda).

- [ ] **Step 4: Rodar testes**

```bash
npm test
```

Esperado: 33/33 passando.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: adicionar campos expandidos e DocumentoCliente ao types.ts"
```

---

## Task 3: Função `calcularComissoes` (lógica pura, testável)

**Files:**
- Create: `src/lib/calcularComissoes.ts`
- Create: `__tests__/calcularComissoes.test.ts`

Esta função é pura — não chama Supabase. Recebe os dados do cliente e retorna os registros de comissão a inserir.

- [ ] **Step 1: Escrever o teste (TDD — teste antes do código)**

Criar `__tests__/calcularComissoes.test.ts`:

```typescript
import { calcularComissoes } from '@/lib/calcularComissoes'

const base = {
  vendaId: 'venda-1',
  valorPlano: 1000,
  dataVenda: '2026-05-20',
  operadora: 'Amil',
}

describe('calcularComissoes', () => {
  it('usa percentuais do cliente quando fornecidos', () => {
    const result = calcularComissoes({
      ...base,
      percentualCorretora: 30,
      percentualVendedor: 10,
      temVitalicio: false,
      percentualVitalicio: null,
    })
    expect(result.parcelas).toHaveLength(1)
    expect(result.parcelas[0].valor_empresa).toBeCloseTo(300)
    expect(result.parcelas[0].valor_vendedor).toBeCloseTo(100)
    expect(result.parcelas[0].valor_bruto).toBeCloseTo(400)
    expect(result.parcelas[0].tipo).toBe('parcela')
    expect(result.vitalicios).toHaveLength(0)
  })

  it('retorna null quando sem percentuais (fallback para regras)', () => {
    const result = calcularComissoes({
      ...base,
      percentualCorretora: null,
      percentualVendedor: null,
      temVitalicio: false,
      percentualVitalicio: null,
    })
    expect(result).toBeNull()
  })

  it('gera vitalício quando tem_vitalicio e percentual_vitalicio', () => {
    const result = calcularComissoes({
      ...base,
      percentualCorretora: 30,
      percentualVendedor: 10,
      temVitalicio: true,
      percentualVitalicio: 2,
    })
    expect(result).not.toBeNull()
    expect(result!.vitalicios).toHaveLength(1)
    expect(result!.vitalicios[0].valor_bruto).toBeCloseTo(20)
    // Split proporcional: corretora=30, vendedor=10 → empresa=75%, vendedor=25%
    expect(result!.vitalicios[0].valor_empresa).toBeCloseTo(15)
    expect(result!.vitalicios[0].valor_vendedor).toBeCloseTo(5)
  })

  it('vitalício sem percentuais de split fica 100% empresa', () => {
    const result = calcularComissoes({
      ...base,
      percentualCorretora: null,
      percentualVendedor: null,
      temVitalicio: true,
      percentualVitalicio: 2,
    })
    // Sem percentuais de parcela → retorna null para parcelas mas ainda gera vitalício
    expect(result).not.toBeNull()
    expect(result!.parcelas).toHaveLength(0)
    expect(result!.vitalicios[0].valor_empresa).toBeCloseTo(20)
    expect(result!.vitalicios[0].valor_vendedor).toBeCloseTo(0)
  })

  it('ignora vitalício se percentual_vitalicio é 0 ou null', () => {
    const result = calcularComissoes({
      ...base,
      percentualCorretora: 30,
      percentualVendedor: 10,
      temVitalicio: true,
      percentualVitalicio: 0,
    })
    expect(result!.vitalicios).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

```bash
npm test -- calcularComissoes 2>&1 | tail -20
```

Esperado: FAIL — `Cannot find module '@/lib/calcularComissoes'`

- [ ] **Step 3: Implementar `calcularComissoes.ts`**

Criar `src/lib/calcularComissoes.ts`:

```typescript
export interface ComissaoParaInserir {
  venda_id: string
  tipo: 'parcela' | 'vitalicio'
  numero_parcela: number | null
  valor_bruto: number
  valor_empresa: number
  valor_vendedor: number
  status_empresa: 'Pendente'
  status_vendedor: 'Pendente'
  data_prevista: string
  data_recebida_empresa: null
  data_recebida_vendedor: null
}

interface Params {
  vendaId: string
  valorPlano: number
  dataVenda: string
  operadora: string
  percentualCorretora: number | null
  percentualVendedor: number | null
  temVitalicio: boolean | null
  percentualVitalicio: number | null
}

interface Resultado {
  parcelas: ComissaoParaInserir[]
  vitalicios: ComissaoParaInserir[]
}

function addMonth(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + n)
  return d.toISOString().split('T')[0]
}

export function calcularComissoes(params: Params): Resultado | null {
  const { vendaId, valorPlano, dataVenda, percentualCorretora, percentualVendedor, temVitalicio, percentualVitalicio } = params

  const pctCorretora = percentualCorretora ?? 0
  const pctVendedor = percentualVendedor ?? 0
  const temPercentuais = pctCorretora > 0 || pctVendedor > 0
  const temVit = temVitalicio && percentualVitalicio != null && percentualVitalicio > 0

  // Sem percentuais próprios e sem vitalício → fallback para regras_comissao
  if (!temPercentuais && !temVit) return null

  const parcelas: ComissaoParaInserir[] = []
  const vitalicios: ComissaoParaInserir[] = []

  if (temPercentuais) {
    const valorEmpresa = valorPlano * (pctCorretora / 100)
    const valorVendedor = valorPlano * (pctVendedor / 100)
    parcelas.push({
      venda_id: vendaId,
      tipo: 'parcela',
      numero_parcela: 1,
      valor_bruto: valorEmpresa + valorVendedor,
      valor_empresa: valorEmpresa,
      valor_vendedor: valorVendedor,
      status_empresa: 'Pendente',
      status_vendedor: 'Pendente',
      data_prevista: dataVenda,
      data_recebida_empresa: null,
      data_recebida_vendedor: null,
    })
  }

  if (temVit) {
    const valorBruto = valorPlano * (percentualVitalicio! / 100)
    const totalSplit = pctCorretora + pctVendedor
    const valorEmpresa = totalSplit > 0 ? valorBruto * (pctCorretora / totalSplit) : valorBruto
    const valorVendedor = totalSplit > 0 ? valorBruto * (pctVendedor / totalSplit) : 0
    vitalicios.push({
      venda_id: vendaId,
      tipo: 'vitalicio',
      numero_parcela: null,
      valor_bruto: valorBruto,
      valor_empresa: valorEmpresa,
      valor_vendedor: valorVendedor,
      status_empresa: 'Pendente',
      status_vendedor: 'Pendente',
      data_prevista: addMonth(dataVenda, 1),
      data_recebida_empresa: null,
      data_recebida_vendedor: null,
    })
  }

  return { parcelas, vitalicios }
}
```

- [ ] **Step 4: Rodar testes**

```bash
npm test -- calcularComissoes 2>&1 | tail -20
```

Esperado: 5/5 passando.

- [ ] **Step 5: Rodar todos os testes**

```bash
npm test
```

Esperado: 38/38 passando (33 anteriores + 5 novos).

- [ ] **Step 6: Commit**

```bash
git add src/lib/calcularComissoes.ts __tests__/calcularComissoes.test.ts
git commit -m "feat: calcularComissoes — função pura para geração de comissões por percentual"
```

---

## Task 4: ClienteFormPosVenda — Novos campos Dados do Plano

**Files:**
- Modify: `src/components/ClienteFormPosVenda.tsx`

- [ ] **Step 1: Adicionar estados para os novos campos do plano**

No início de `ClienteFormPosVenda`, após os estados existentes de "Dados do Plano", adicionar:

```typescript
// Dados do Plano — novos campos
const [dataInicio, setDataInicio]         = useState(cliente?.data_inicio_plano ?? '')
const [dataVencimento, setDataVencimento] = useState(cliente?.data_vencimento_plano ?? '')
const [coparticipacao, setCoparticipacao] = useState(cliente?.coparticipacao ?? false)
const [tipoAcomodacao, setTipoAcomodacao] = useState(cliente?.tipo_acomodacao ?? '')
const [abrangencia, setAbrangencia]       = useState(cliente?.abrangencia ?? '')
const [carencia, setCarencia]             = useState(cliente?.carencia ?? false)
```

- [ ] **Step 2: Incluir novos campos no `payload` do handleSubmit**

No objeto `payload: ClienteInsert`, adicionar:

```typescript
data_inicio_plano:    dataInicio || null,
data_vencimento_plano: dataVencimento || null,
coparticipacao:       coparticipacao,
tipo_acomodacao:      tipoAcomodacao || null,
abrangencia:          abrangencia || null,
carencia:             carencia,
```

- [ ] **Step 3: Adicionar campos ao JSX — seção "Dados do Plano"**

Dentro do grid de "Dados do Plano", após o bloco de "Data de Implantação" e antes de "Status", adicionar:

```tsx
{/* Data de Início + Data de Vencimento */}
<div>
  <label className={labelCls} style={labelStyle}>Data de Início do Plano</label>
  <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
    className={inputCls} style={inputStyle} />
</div>

<div>
  <label className={labelCls} style={labelStyle}>Data de Vencimento</label>
  <input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)}
    className={inputCls} style={inputStyle} />
</div>

{/* Tipo de Acomodação + Abrangência */}
<div>
  <label className={labelCls} style={labelStyle}>Tipo de Acomodação</label>
  <select value={tipoAcomodacao} onChange={e => setTipoAcomodacao(e.target.value)}
    className={inputCls} style={{ ...inputStyle, color: tipoAcomodacao ? '#1a1a1a' : '#9a918a' }}>
    <option value="">Selecione...</option>
    <option value="Enfermaria">Enfermaria</option>
    <option value="Apartamento">Apartamento</option>
    <option value="UTI">UTI</option>
  </select>
</div>

<div>
  <label className={labelCls} style={labelStyle}>Abrangência</label>
  <select value={abrangencia} onChange={e => setAbrangencia(e.target.value)}
    className={inputCls} style={{ ...inputStyle, color: abrangencia ? '#1a1a1a' : '#9a918a' }}>
    <option value="">Selecione...</option>
    <option value="Municipal">Municipal</option>
    <option value="Estadual">Estadual</option>
    <option value="Nacional">Nacional</option>
  </select>
</div>

{/* Coparticipação + Carência (toggles) */}
<div>
  <label className={labelCls} style={labelStyle}>Coparticipação</label>
  <div className="flex gap-3 mt-1">
    {[true, false].map(v => (
      <button key={String(v)} type="button"
        onClick={() => setCoparticipacao(v)}
        className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
        style={{
          borderColor: coparticipacao === v ? '#2d1f4e' : '#e8e4dd',
          backgroundColor: coparticipacao === v ? '#2d1f4e' : '#ffffff',
          color: coparticipacao === v ? '#ffffff' : '#5a4e3c',
        }}>
        {v ? 'Sim' : 'Não'}
      </button>
    ))}
  </div>
</div>

<div>
  <label className={labelCls} style={labelStyle}>Carência</label>
  <div className="flex gap-3 mt-1">
    {[true, false].map(v => (
      <button key={String(v)} type="button"
        onClick={() => setCarencia(v)}
        className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
        style={{
          borderColor: carencia === v ? '#2d1f4e' : '#e8e4dd',
          backgroundColor: carencia === v ? '#2d1f4e' : '#ffffff',
          color: carencia === v ? '#ffffff' : '#5a4e3c',
        }}>
        {v ? 'Sim' : 'Não'}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Build + testes**

```bash
npm run build 2>&1 | tail -10
npm test
```

Esperado: build limpo, 38/38 passando.

- [ ] **Step 5: Commit**

```bash
git add src/components/ClienteFormPosVenda.tsx
git commit -m "feat: ClienteFormPosVenda — novos campos Dados do Plano"
```

---

## Task 5: ClienteFormPosVenda — Dados Comerciais + integração Financeiro

**Files:**
- Modify: `src/components/ClienteFormPosVenda.tsx`

- [ ] **Step 1: Adicionar import de `calcularComissoes`**

No topo do arquivo, adicionar:

```typescript
import { calcularComissoes } from '@/lib/calcularComissoes'
```

- [ ] **Step 2: Adicionar estados dos novos campos comerciais**

Após os estados existentes de "Dados Comerciais", adicionar:

```typescript
// Dados Comerciais — novos
const [corretora, setCorretora]         = useState(cliente?.corretora_responsavel ?? '')
const [formaPagamento, setFormaPagamento] = useState(cliente?.forma_pagamento ?? '')
const [diaVencimento, setDiaVencimento] = useState(cliente?.dia_vencimento_boleto?.toString() ?? '')
const [pctCorretora, setPctCorretora]   = useState(cliente?.percentual_comissao_corretora?.toString() ?? '')
const [pctVendedor, setPctVendedor]     = useState(cliente?.percentual_comissao_vendedor?.toString() ?? '')
const [temVitalicio, setTemVitalicio]   = useState(cliente?.tem_vitalicio ?? false)
const [pctVitalicio, setPctVitalicio]   = useState(cliente?.percentual_vitalicio?.toString() ?? '')
```

- [ ] **Step 3: Incluir novos campos no `payload`**

No objeto `payload: ClienteInsert`, adicionar:

```typescript
corretora_responsavel:        corretora || null,
forma_pagamento:              formaPagamento || null,
dia_vencimento_boleto:        diaVencimento ? Number(diaVencimento) : null,
percentual_comissao_corretora: pctCorretora ? Number(pctCorretora) : null,
percentual_comissao_vendedor:  pctVendedor ? Number(pctVendedor) : null,
tem_vitalicio:                temVitalicio,
percentual_vitalicio:         pctVitalicio ? Number(pctVitalicio) : null,
```

- [ ] **Step 4: Atualizar lógica de geração de comissões no handleSubmit**

Dentro do bloco que cria/atualiza a venda (após o insert/update da venda no Supabase), substituir a geração atual de comissões por:

```typescript
// Gera/atualiza comissões após criar/atualizar a venda
async function gerarComissoes(vendaId: string, clienteId: string) {
  const dataVendaFinal = payload.data_venda ?? new Date().toISOString().split('T')[0]
  const resultado = calcularComissoes({
    vendaId,
    valorPlano: payload.valor_plano!,
    dataVenda: dataVendaFinal,
    operadora: payload.operadora!,
    percentualCorretora: payload.percentual_comissao_corretora ?? null,
    percentualVendedor: payload.percentual_comissao_vendedor ?? null,
    temVitalicio: payload.tem_vitalicio ?? null,
    percentualVitalicio: payload.percentual_vitalicio ?? null,
  })

  if (resultado) {
    // Usa percentuais próprios do cliente
    await supabase.from('comissoes').delete()
      .eq('venda_id', vendaId).eq('tipo', 'parcela')
    await supabase.from('comissoes').delete()
      .eq('venda_id', vendaId).eq('tipo', 'vitalicio')
    const todasComissoes = [...resultado.parcelas, ...resultado.vitalicios]
    if (todasComissoes.length > 0) {
      await supabase.from('comissoes').insert(todasComissoes)
    }
  } else if (payload.operadora) {
    // Fallback: busca regra da operadora
    const { data: regra } = await supabase
      .from('regras_comissao')
      .select('id, percentual_total, num_parcelas, percentual_vitalicio')
      .eq('operadora', payload.operadora)
      .eq('ativo', true)
      .maybeSingle()

    if (regra) {
      const { data: parcelas } = await supabase
        .from('parcelas_regra')
        .select('numero_parcela, percentual_empresa, percentual_vendedor')
        .eq('regra_id', regra.id)
        .order('numero_parcela')

      const parcelasArr = parcelas ?? []
      const comissoesParaInserir = []

      for (let i = 1; i <= regra.num_parcelas; i++) {
        const pr = parcelasArr.find(p => p.numero_parcela === i)
        const pctEmp = pr?.percentual_empresa ?? 50
        const pctVend = pr?.percentual_vendedor ?? 50
        const valorBruto = payload.valor_plano! * (regra.percentual_total / 100) / regra.num_parcelas
        const d = new Date(dataVendaFinal)
        d.setMonth(d.getMonth() + (i - 1))
        comissoesParaInserir.push({
          venda_id: vendaId,
          tipo: 'parcela' as const,
          numero_parcela: i,
          valor_bruto: valorBruto,
          valor_empresa: valorBruto * (pctEmp / 100),
          valor_vendedor: valorBruto * (pctVend / 100),
          status_empresa: 'Pendente' as const,
          status_vendedor: 'Pendente' as const,
          data_prevista: d.toISOString().split('T')[0],
          data_recebida_empresa: null,
          data_recebida_vendedor: null,
        })
      }

      if (regra.percentual_vitalicio > 0) {
        const valorBruto = payload.valor_plano! * (regra.percentual_vitalicio / 100)
        const ultima = parcelasArr[parcelasArr.length - 1]
        const pctEmp = ultima?.percentual_empresa ?? 50
        const pctVend = ultima?.percentual_vendedor ?? 50
        const d = new Date(dataVendaFinal)
        d.setMonth(d.getMonth() + regra.num_parcelas)
        comissoesParaInserir.push({
          venda_id: vendaId,
          tipo: 'vitalicio' as const,
          numero_parcela: null,
          valor_bruto: valorBruto,
          valor_empresa: valorBruto * (pctEmp / 100),
          valor_vendedor: valorBruto * (pctVend / 100),
          status_empresa: 'Pendente' as const,
          status_vendedor: 'Pendente' as const,
          data_prevista: d.toISOString().split('T')[0],
          data_recebida_empresa: null,
          data_recebida_vendedor: null,
        })
      }

      await supabase.from('comissoes').delete().eq('venda_id', vendaId)
      if (comissoesParaInserir.length > 0) {
        await supabase.from('comissoes').insert(comissoesParaInserir)
      }
    }
  }
}
```

Chamar `gerarComissoes(vendaId, clienteId)` nos dois fluxos (insert e update), após garantir que a venda foi criada/atualizada com sucesso.

No fluxo de **insert** (novo cliente):
```typescript
if (novoCliente && payload.valor_plano && payload.operadora) {
  const { data: novaVenda } = await supabase.from('vendas').insert({...}).select().single()
  if (novaVenda) await gerarComissoes(novaVenda.id, novoCliente.id)
}
```

No fluxo de **update** (editar cliente):
```typescript
if (payload.valor_plano && payload.operadora) {
  // ... lógica existente de criar/atualizar venda ...
  if (vendaId) await gerarComissoes(vendaId, cliente.id)
}
```

- [ ] **Step 5: Adicionar campos ao JSX — seção "Dados Comerciais"**

Reestruturar a seção "Dados Comerciais" para incluir os novos campos após "Vendedor":

```tsx
{/* Corretora Responsável */}
<div>
  <label className={labelCls} style={labelStyle}>Corretora Responsável</label>
  <select value={corretora} onChange={e => setCorretora(e.target.value)}
    className={inputCls} style={{ ...inputStyle, color: corretora ? '#1a1a1a' : '#9a918a' }}>
    <option value="">Selecione...</option>
    <option value="A2 Prime">A2 Prime</option>
    <option value="A2 Corretora">A2 Corretora</option>
    <option value="MEI Alessandro">MEI Alessandro</option>
  </select>
</div>

{/* Forma de Pagamento */}
<div>
  <label className={labelCls} style={labelStyle}>Forma de Pagamento</label>
  <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}
    className={inputCls} style={{ ...inputStyle, color: formaPagamento ? '#1a1a1a' : '#9a918a' }}>
    <option value="">Selecione...</option>
    <option value="Boleto">Boleto</option>
    <option value="Débito">Débito</option>
    <option value="Cartão">Cartão</option>
    <option value="Desconto em Folha">Desconto em Folha</option>
  </select>
</div>

{/* Dia de Vencimento — apenas se Boleto */}
{formaPagamento === 'Boleto' && (
  <div>
    <label className={labelCls} style={labelStyle}>Dia de Vencimento do Boleto</label>
    <input type="number" min="1" max="31" value={diaVencimento}
      onChange={e => setDiaVencimento(e.target.value)}
      placeholder="Ex: 10"
      className={inputCls} style={inputStyle} />
  </div>
)}

{/* % Comissão Corretora + % Comissão Vendedor */}
<div>
  <label className={labelCls} style={labelStyle}>% Comissão Corretora</label>
  <input type="number" step="0.01" min="0" max="100" value={pctCorretora}
    onChange={e => setPctCorretora(e.target.value)}
    placeholder="Ex: 30"
    className={inputCls} style={inputStyle} />
</div>

<div>
  <label className={labelCls} style={labelStyle}>% Comissão Vendedor</label>
  <input type="number" step="0.01" min="0" max="100" value={pctVendedor}
    onChange={e => setPctVendedor(e.target.value)}
    placeholder="Ex: 10"
    className={inputCls} style={inputStyle} />
</div>

{/* Tem Vitalício */}
<div className="md:col-span-2">
  <label className={labelCls} style={labelStyle}>Tem Vitalício</label>
  <div className="flex gap-3 mt-1 max-w-xs">
    {[true, false].map(v => (
      <button key={String(v)} type="button"
        onClick={() => setTemVitalicio(v)}
        className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
        style={{
          borderColor: temVitalicio === v ? '#b89a6a' : '#e8e4dd',
          backgroundColor: temVitalicio === v ? '#b89a6a' : '#ffffff',
          color: temVitalicio === v ? '#ffffff' : '#5a4e3c',
        }}>
        {v ? 'Sim' : 'Não'}
      </button>
    ))}
  </div>
</div>

{/* % Vitalício — apenas se Sim */}
{temVitalicio && (
  <div>
    <label className={labelCls} style={labelStyle}>% Vitalício (mensal)</label>
    <input type="number" step="0.01" min="0" max="100" value={pctVitalicio}
      onChange={e => setPctVitalicio(e.target.value)}
      placeholder="Ex: 2"
      className={inputCls} style={inputStyle} />
  </div>
)}
```

- [ ] **Step 6: Build + testes**

```bash
npm run build 2>&1 | tail -10
npm test
```

Esperado: build limpo, 38/38 passando.

- [ ] **Step 7: Commit**

```bash
git add src/components/ClienteFormPosVenda.tsx
git commit -m "feat: ClienteFormPosVenda — Dados Comerciais + integração comissões por percentual"
```

---

## Task 6: Componentes de Documentos (somente em edição)

**Files:**
- Create: `src/components/DocumentosCliente.tsx`
- Create: `src/components/AdicionarDocumentoModal.tsx`
- Modify: `src/components/ClienteFormPosVenda.tsx`

### AdicionarDocumentoModal

- [ ] **Step 1: Criar `AdicionarDocumentoModal.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { X, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  clienteId: string
  onClose: () => void
  onSalvo: () => void
}

const TIPOS = ['Contrato', 'Proposta', 'RG', 'CNH', 'Outro'] as const
type Tipo = typeof TIPOS[number]
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export default function AdicionarDocumentoModal({ clienteId, onClose, onSalvo }: Props) {
  const supabase = createClient()
  const [tipo, setTipo] = useState<Tipo>('Contrato')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (!TIPOS_ACEITOS.includes(f.type)) {
      setErro('Formato não suportado. Use PDF, JPG, PNG ou DOCX.')
      return
    }
    if (f.size > MAX_BYTES) {
      setErro('Arquivo muito grande. Máximo 10 MB.')
      return
    }
    setErro(null)
    setArquivo(f)
  }

  async function handleEnviar() {
    if (!arquivo) { setErro('Selecione um arquivo.'); return }
    setEnviando(true)
    setErro(null)

    const ext = arquivo.name.split('.').pop()
    const path = `${clienteId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('clientes-documentos')
      .upload(path, arquivo)

    if (uploadErr) {
      setErro('Erro ao enviar arquivo: ' + uploadErr.message)
      setEnviando(false)
      return
    }

    const { error: dbErr } = await supabase.from('documentos_cliente').insert({
      cliente_id: clienteId,
      tipo,
      nome_arquivo: arquivo.name,
      storage_path: path,
      tamanho_bytes: arquivo.size,
    })

    if (dbErr) {
      setErro('Arquivo enviado mas erro ao salvar registro: ' + dbErr.message)
      setEnviando(false)
      return
    }

    onSalvo()
  }

  const inputCls = 'w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2'
  const inputStyle = { borderColor: '#e8e4dd' }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#e8e4dd' }}>
          <h3 className="text-base font-bold" style={{ color: '#2d1f4e' }}>Adicionar Documento</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} style={{ color: '#9a918a' }} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value as Tipo)}
              className={inputCls} style={inputStyle}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Arquivo</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: arquivo ? '#b89a6a' : '#e8e4dd' }}>
              <Upload size={20} style={{ color: arquivo ? '#b89a6a' : '#9a918a' }} />
              <span className="text-sm mt-2" style={{ color: arquivo ? '#2d1f4e' : '#9a918a' }}>
                {arquivo ? arquivo.name : 'Clique para selecionar'}
              </span>
              <span className="text-xs mt-0.5 text-gray-400">PDF, JPG, PNG, DOCX — máx 10 MB</span>
              <input type="file" className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={handleArquivo} />
            </label>
          </div>

          {erro && (
            <p className="text-sm rounded-xl px-3 py-2" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
              {erro}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t" style={{ borderColor: '#e8e4dd' }}>
          <button onClick={onClose} disabled={enviando}
            className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}>
            Cancelar
          </button>
          <button onClick={handleEnviar} disabled={enviando || !arquivo}
            className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### DocumentosCliente

- [ ] **Step 2: Criar `DocumentosCliente.tsx`**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Download, Trash2, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DocumentoCliente } from '@/lib/types'
import AdicionarDocumentoModal from './AdicionarDocumentoModal'

interface Props {
  clienteId: string
}

const TIPO_COR: Record<DocumentoCliente['tipo'], { bg: string; text: string }> = {
  Contrato: { bg: '#dbeafe', text: '#1d4ed8' },
  Proposta: { bg: '#fef3c7', text: '#92400e' },
  RG:       { bg: '#dcfce7', text: '#15803d' },
  CNH:      { bg: '#ede9f8', text: '#2d1f4e' },
  Outro:    { bg: '#f3f4f6', text: '#374151' },
}

export default function DocumentosCliente({ clienteId }: Props) {
  const supabase = createClient()
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const { data } = await supabase
      .from('documentos_cliente')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('criado_em', { ascending: false })
    setDocumentos(data ?? [])
    setCarregando(false)
  }, [clienteId])

  useEffect(() => { carregar() }, [carregar])

  async function handleDownload(doc: DocumentoCliente) {
    const { data } = await supabase.storage
      .from('clientes-documentos')
      .createSignedUrl(doc.storage_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleExcluir(doc: DocumentoCliente) {
    if (!confirm(`Excluir "${doc.nome_arquivo}"?`)) return
    await supabase.storage.from('clientes-documentos').remove([doc.storage_path])
    await supabase.from('documentos_cliente').delete().eq('id', doc.id)
    carregar()
  }

  function formatBytes(bytes: number | null): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
      <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: '#e8e4dd' }}>
        <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Documentos</h3>
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          <Plus size={13} />
          Adicionar
        </button>
      </div>

      {carregando ? (
        <p className="text-sm text-gray-400 py-4 text-center">Carregando...</p>
      ) : documentos.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-gray-400">
          <FileText size={32} strokeWidth={1.5} />
          <p className="text-sm mt-2">Nenhum documento enviado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map(doc => {
            const cor = TIPO_COR[doc.tipo]
            return (
              <div key={doc.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: '#faf8f5' }}>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: cor.bg, color: cor.text }}>
                  {doc.tipo}
                </span>
                <span className="flex-1 text-sm font-medium truncate" style={{ color: '#2d1f4e' }}>
                  {doc.nome_arquivo}
                </span>
                {doc.tamanho_bytes && (
                  <span className="text-xs shrink-0" style={{ color: '#9a918a' }}>
                    {formatBytes(doc.tamanho_bytes)}
                  </span>
                )}
                <button type="button" onClick={() => handleDownload(doc)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                  title="Download">
                  <Download size={14} style={{ color: '#2d1f4e' }} />
                </button>
                <button type="button" onClick={() => handleExcluir(doc)}
                  className="p-1.5 rounded-lg hover:bg-red-100 transition-colors shrink-0"
                  title="Excluir">
                  <Trash2 size={14} style={{ color: '#b91c1c' }} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {modalAberto && (
        <AdicionarDocumentoModal
          clienteId={clienteId}
          onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); carregar() }}
        />
      )}
    </div>
  )
}
```

### Integrar em ClienteFormPosVenda

- [ ] **Step 3: Adicionar seção de documentos ao formulário (somente em modo edição)**

No topo de `ClienteFormPosVenda.tsx`, adicionar import:

```typescript
import DocumentosCliente from './DocumentosCliente'
```

No JSX, após a seção "Dados Comerciais" e antes do botão de submit, adicionar:

```tsx
{/* ── Documentos (somente ao editar) ── */}
{editando && cliente?.id && (
  <DocumentosCliente clienteId={cliente.id} />
)}
```

- [ ] **Step 4: Build + testes**

```bash
npm run build 2>&1 | tail -10
npm test
```

Esperado: build limpo, 38/38 passando.

- [ ] **Step 5: Commit e push**

```bash
git add src/components/DocumentosCliente.tsx src/components/AdicionarDocumentoModal.tsx src/components/ClienteFormPosVenda.tsx
git commit -m "feat: DocumentosCliente + AdicionarDocumentoModal — upload por tipo no cadastro de clientes"
git push origin master
```
