# Esconder o Vitalício do Vendedor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pro perfil `vendedor`, nenhuma menção nem valor de vitalício/comissão da corretora aparece (nem chega ao navegador); admin continua vendo tudo.

**Architecture:** Server components (`ficha`, `editar`, `novo`) consultam `getUsuarioAtual()` e (a) não renderizam o campo Comissão, (b) apagam os campos sensíveis do objeto `cliente` antes de passar pro client component, (c) passam a prop nova `mostrarVitalicio` pro `ClienteFormPosVenda`, que esconde a seção de fase/vitalício e não inclui essas chaves no payload de save.

**Tech Stack:** Next.js (App Router, server components com `params: Promise<...>`), Supabase (RLS já isola linhas por vendedor), Jest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-07-12-esconder-vitalicio-vendedor-design.md`

## Global Constraints

- Este repo usa uma versão de Next.js DIFERENTE do padrão (ver `AGENTS.md`): siga os idiomas já usados nos arquivos vizinhos (ex.: `params`/`searchParams` são `Promise` e precisam de `await`); se precisar de API nova, leia `node_modules/next/dist/docs/` antes.
- Campos sensíveis (decisão da Andreia): `comissao`, `fase_cliente`, `vitalicio_valor_estimado`, `vitalicio_dia_previsto`, `vitalicio_inicio`. A palavra "vitalício" não pode aparecer na UI do vendedor.
- Sessão nula (`getUsuarioAtual()` → null) = tratar como vendedor (esconder).
- O worktree tem uma alteração NÃO relacionada pendente em `src/app/api/chat/route.ts`. NUNCA use `git add -A`/`git add .` — sempre stage por caminho explícito.
- Testes: `npx jest <arquivo>` (jsdom + Testing Library, padrão dos testes existentes em `__tests__/`).
- Mensagens de commit em português, estilo do histórico (`feat(...)`, `test(...)`), terminando com `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Ficha do cliente — esconder o campo Comissão

**Files:**
- Modify: `src/app/(protected)/clientes/[id]/page.tsx`
- Test: `__tests__/FichaCliente.test.tsx` (novo)

**Interfaces:**
- Consumes: `getUsuarioAtual(): Promise<UsuarioAtual | null>` de `@/lib/getUsuarioAtual` (`UsuarioAtual.perfil` é `'admin' | 'vendedor'`).
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Write the failing test**

Criar `__tests__/FichaCliente.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import FichaClientePage from '@/app/(protected)/clientes/[id]/page'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'

jest.mock('@/lib/getUsuarioAtual', () => ({
  getUsuarioAtual: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              id: '1', nome: 'Maria Souza', status: 'Ativo', comissao: 150,
              observacoes: 'Controle de estorno: ver extrato',
              cpf: null, data_nascimento: null, contato: null, email: null,
              endereco: null, operadora: 'Amil', administradora: null,
              tipo_plano: null, quantidade_vidas: null, valor_plano: 350,
              numero_contrato: null, data_venda: null, data_implantacao: null,
              vendedor: 'João', fase_cliente: 'vitalicio',
            },
            error: null,
          }),
        }),
      }),
    }),
  }),
}))

const mockGetUsuarioAtual = getUsuarioAtual as jest.Mock

const params = Promise.resolve({ id: '1' })

describe('FichaClientePage — campo Comissão por perfil', () => {
  it('admin vê o campo Comissão', async () => {
    mockGetUsuarioAtual.mockResolvedValue({ id: 'u1', auth_user_id: 'a1', nome: 'Andreia', perfil: 'admin', vendedor_id: null })
    render(await FichaClientePage({ params }))
    expect(screen.getByText('Comissão')).toBeInTheDocument()
    expect(screen.getByText('R$ 150,00')).toBeInTheDocument()
  })

  it('vendedor não vê o campo Comissão (mas vê Observações)', async () => {
    mockGetUsuarioAtual.mockResolvedValue({ id: 'u2', auth_user_id: 'a2', nome: 'João', perfil: 'vendedor', vendedor_id: 'v1' })
    render(await FichaClientePage({ params }))
    expect(screen.queryByText('Comissão')).not.toBeInTheDocument()
    expect(screen.queryByText('R$ 150,00')).not.toBeInTheDocument()
    expect(screen.getByText('Controle de estorno: ver extrato')).toBeInTheDocument()
  })

  it('sessão nula esconde a Comissão (mais restritivo)', async () => {
    mockGetUsuarioAtual.mockResolvedValue(null)
    render(await FichaClientePage({ params }))
    expect(screen.queryByText('Comissão')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/FichaCliente.test.tsx`
Expected: FAIL — os testes de vendedor/sessão nula falham porque hoje a página sempre renderiza `Comissão` (e o teste de admin pode falhar por a página nem chamar `getUsuarioAtual`).

- [ ] **Step 3: Write minimal implementation**

Em `src/app/(protected)/clientes/[id]/page.tsx`:

1. Adicionar o import no topo (junto dos outros):

```tsx
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
```

2. Dentro de `FichaClientePage`, logo após `const supabase = await createClient()`:

```tsx
const usuario = await getUsuarioAtual()
const isAdmin = usuario?.perfil === 'admin'
```

3. Na seção "Dados Comerciais", trocar:

```tsx
<Campo label="Comissão" value={fmtMoeda(c.comissao)} />
```

por:

```tsx
{isAdmin && <Campo label="Comissão" value={fmtMoeda(c.comissao)} />}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/FichaCliente.test.tsx`
Expected: PASS (3 testes)

- [ ] **Step 5: Commit**

```bash
git add "src/app/(protected)/clientes/[id]/page.tsx" __tests__/FichaCliente.test.tsx
git commit -m "feat(clientes): vendedor nao ve o campo Comissao na ficha

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: `ClienteFormPosVenda` — prop `mostrarVitalicio`

**Files:**
- Modify: `src/components/ClienteFormPosVenda.tsx`
- Test: `__tests__/ClienteFormPosVenda.test.tsx` (existente — estender)

**Interfaces:**
- Consumes: nada de outras tasks.
- Produces: prop `mostrarVitalicio?: boolean` (default `true`) em `ClienteFormPosVenda` — Task 3 passa `mostrarVitalicio={isAdmin}`.

- [ ] **Step 1: Write the failing tests**

Em `__tests__/ClienteFormPosVenda.test.tsx`, PRIMEIRO trocar o import do topo pra incluir `waitFor` (`import { render, screen, fireEvent, waitFor } from '@testing-library/react'`) e substituir o mock de `@/lib/supabase/client` por uma versão que captura o payload do update e responde às queries extras (o resto do arquivo fica igual):

```tsx
const mockUpdatePayload = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'vendedores') return mockVendedoresChain
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: (payload: object) => {
          mockUpdatePayload(payload)
          return { eq: jest.fn().mockResolvedValue({ error: null }) }
        },
        select: () => ({
          eq: () => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: { fase_cliente: 'ativo' }, error: null }),
            order: () => ({
              limit: () => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }
    },
  }),
}))
```

Depois adicionar ao `describe` existente (reutilizando o objeto `cliente` do teste "pre-fills fields when editing" — extraí-lo pra uma const `clienteBase` no topo do describe):

```tsx
  const clienteBase: Cliente = {
    id: '1', nome: 'Maria Souza', contato: '(83) 99999-9999', email: 'maria@email.com',
    tipo_plano: 'Saúde', operadora: null, quantidade_vidas: null, valor_plano: 350,
    observacoes: 'Cliente VIP', lead_id: null, criado_em: '',
    cpf: null, data_nascimento: null, endereco: null, administradora: null,
    numero_contrato: null, data_venda: null, data_implantacao: null,
    status: 'Ativo', vendedor: null, comissao: null,
  } as Cliente

  it('admin (default) vê a seção Fase do Cliente com o botão Vitalício', () => {
    render(<ClienteFormPosVenda cliente={clienteBase} />)
    expect(screen.getByText('Fase do Cliente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vitalício' })).toBeInTheDocument()
  })

  it('mostrarVitalicio=false não menciona vitalício em lugar nenhum', () => {
    render(<ClienteFormPosVenda cliente={clienteBase} mostrarVitalicio={false} />)
    expect(screen.queryByText('Fase do Cliente')).not.toBeInTheDocument()
    expect(screen.queryByText(/vital/i)).not.toBeInTheDocument()
  })

  it('mostrarVitalicio=false salva sem as chaves de fase/vitalício/comissão', async () => {
    mockUpdatePayload.mockClear()
    render(<ClienteFormPosVenda cliente={clienteBase} mostrarVitalicio={false} />)
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))
    await waitFor(() => expect(mockUpdatePayload).toHaveBeenCalled())
    const payload = mockUpdatePayload.mock.calls[0][0]
    expect(payload).toHaveProperty('nome', 'Maria Souza')
    expect(payload).not.toHaveProperty('fase_cliente')
    expect(payload).not.toHaveProperty('vitalicio_valor_estimado')
    expect(payload).not.toHaveProperty('vitalicio_dia_previsto')
    expect(payload).not.toHaveProperty('vitalicio_inicio')
    expect(payload).not.toHaveProperty('comissao')
  })

  it('default (admin) salva COM as chaves de fase/vitalício', async () => {
    mockUpdatePayload.mockClear()
    render(<ClienteFormPosVenda cliente={clienteBase} />)
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))
    await waitFor(() => expect(mockUpdatePayload).toHaveBeenCalled())
    const payload = mockUpdatePayload.mock.calls[0][0]
    expect(payload).toHaveProperty('fase_cliente', 'ativo')
    expect(payload).toHaveProperty('comissao', null)
  })
```

(Obs: `clienteBase` tem `operadora: null` de propósito — o save não entra no ramo de criar venda/comissões, que não é o alvo destes testes.)

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx jest __tests__/ClienteFormPosVenda.test.tsx`
Expected: os 3 testes antigos PASSAM; os novos FALHAM (prop não existe / seção sempre renderiza / payload sempre tem as chaves).

- [ ] **Step 3: Write the implementation**

Em `src/components/ClienteFormPosVenda.tsx`:

1. Props (linhas 12-16) e assinatura (linha 25):

```tsx
interface Props {
  cliente?: Cliente
  vendedorAtual?: { id: string; nome: string } | null
  leadPrefill?: Lead | null
  mostrarVitalicio?: boolean
}

export default function ClienteFormPosVenda({ cliente, vendedorAtual, leadPrefill, mostrarVitalicio = true }: Props) {
```

2. Logo APÓS o fechamento do objeto `payload` (a linha `}` depois de `vitalicio_inicio: ...`), adicionar:

```tsx
    // Perfil sem acesso ao vitalício: o save não toca nesses campos (preserva o banco)
    const payloadFinal: Partial<ClienteInsert> = { ...payload }
    if (!mostrarVitalicio) {
      delete payloadFinal.fase_cliente
      delete payloadFinal.vitalicio_valor_estimado
      delete payloadFinal.vitalicio_dia_previsto
      delete payloadFinal.vitalicio_inicio
      delete payloadFinal.comissao
    }
```

3. Trocar as DUAS escritas no banco pra usar `payloadFinal` (o resto do código continua lendo `payload`):
   - `supabase.from('clientes').update(payload)` → `supabase.from('clientes').update(payloadFinal)`
   - `supabase.from('clientes').insert(payload)` → `supabase.from('clientes').insert(payloadFinal)`

4. No bloco `if (editando) {`, logo no início (antes do `update`), adicionar a checagem da fase real (o form do vendedor recebe o cliente com a fase apagada — sem isso, editar um cliente vitalício recriaria venda/comissões):

```tsx
      // O vendedor não recebe a fase real do cliente — busca no banco pra não
      // recriar venda de um cliente que já é vitalício
      let faseRealVitalicio = cliente.fase_cliente === 'vitalicio'
      if (!mostrarVitalicio) {
        const { data: faseRow } = await supabase
          .from('clientes')
          .select('fase_cliente')
          .eq('id', cliente.id)
          .maybeSingle()
        faseRealVitalicio = faseRow?.fase_cliente === 'vitalicio'
      }
```

   E na condição do ramo que cria/atualiza venda (linha ~269), acrescentar `&& !faseRealVitalicio`:

```tsx
      } else if (status === 'Ativo' && payload.valor_plano && payload.operadora && faseCliente !== 'vitalicio' && !faseRealVitalicio) {
```

5. Na renderização, envolver os dois blocos do vitalício (o `{/* Fase do cliente */}` `<div className="md:col-span-2">...</div>` E o `{faseCliente === 'vitalicio' && (...)}` logo abaixo) num único condicional:

```tsx
          {mostrarVitalicio && (
            <>
              {/* Fase do cliente */}
              <div className="md:col-span-2">
                <label className={labelCls} style={labelStyle}>Fase do Cliente</label>
                <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4dd', width: 'fit-content' }}>
                  {(['ativo', 'vitalicio'] as const).map(f => (
                    <button key={f} type="button" onClick={() => setFaseCliente(f)}
                      className="px-5 py-2 text-sm font-medium transition-colors"
                      style={{ backgroundColor: faseCliente === f ? '#2d1f4e' : '#fff', color: faseCliente === f ? '#fff' : '#9a918a' }}>
                      {f === 'ativo' ? 'Ativo com parcelas' : 'Vitalício'}
                    </button>
                  ))}
                </div>
              </div>

              {faseCliente === 'vitalicio' && (
                <>
                  <div>
                    <label className={labelCls} style={labelStyle}>Valor Estimado Mensal (R$)</label>
                    <input type="number" step="0.01" min="0" value={vitalicioValor}
                      onChange={e => setVitalicioValor(e.target.value)}
                      placeholder="Ex: 350.00" className={inputCls} style={inputStyle} />
                    <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Valor aproximado que entra todo mês</p>
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Dia Previsto de Recebimento</label>
                    <input type="number" step="1" min="1" max="31" value={vitaliicioDia}
                      onChange={e => setVitaliicioDia(e.target.value)}
                      placeholder="Ex: 10" className={inputCls} style={inputStyle} />
                    <p className="text-xs mt-1" style={{ color: '#9a918a' }}>Dia do mês em que costuma entrar</p>
                  </div>
                </>
              )}
            </>
          )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/ClienteFormPosVenda.test.tsx`
Expected: PASS (7 testes — 3 antigos + 4 novos)

- [ ] **Step 5: Commit**

```bash
git add src/components/ClienteFormPosVenda.tsx __tests__/ClienteFormPosVenda.test.tsx
git commit -m "feat(clientes): prop mostrarVitalicio esconde fase e valores no form

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Páginas `editar` e `novo` — apagar campos no servidor e passar a prop

**Files:**
- Modify: `src/app/(protected)/clientes/[id]/editar/page.tsx`
- Modify: `src/app/(protected)/clientes/novo/page.tsx`
- Test: `__tests__/EditarClientePage.test.tsx` (novo)

**Interfaces:**
- Consumes: prop `mostrarVitalicio` da Task 2; `getUsuarioAtual()`.
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Write the failing test**

Criar `__tests__/EditarClientePage.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import EditarClientePage from '@/app/(protected)/clientes/[id]/editar/page'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'

const mockFormProps = jest.fn()

jest.mock('@/components/ClienteFormPosVenda', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockFormProps(props)
    return <div data-testid="form" />
  },
}))

jest.mock('@/lib/getUsuarioAtual', () => ({
  getUsuarioAtual: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              id: '1', nome: 'Maria Souza', status: 'Ativo', comissao: 150,
              fase_cliente: 'vitalicio', vitalicio_valor_estimado: 24.5,
              vitalicio_dia_previsto: 15, vitalicio_inicio: '2026-01-10',
            },
            error: null,
          }),
        }),
      }),
    }),
  }),
}))

const mockGetUsuarioAtual = getUsuarioAtual as jest.Mock
const params = Promise.resolve({ id: '1' })

describe('EditarClientePage — dados sensíveis por perfil', () => {
  beforeEach(() => mockFormProps.mockClear())

  it('admin recebe o cliente intacto e mostrarVitalicio=true', async () => {
    mockGetUsuarioAtual.mockResolvedValue({ id: 'u1', auth_user_id: 'a1', nome: 'Andreia', perfil: 'admin', vendedor_id: null })
    render(await EditarClientePage({ params }))
    const props = mockFormProps.mock.calls[0][0]
    expect(props.mostrarVitalicio).toBe(true)
    expect(props.cliente.comissao).toBe(150)
    expect(props.cliente.fase_cliente).toBe('vitalicio')
    expect(props.cliente.vitalicio_valor_estimado).toBe(24.5)
  })

  it('vendedor recebe o cliente SEM comissão/fase/valores de vitalício', async () => {
    mockGetUsuarioAtual.mockResolvedValue({ id: 'u2', auth_user_id: 'a2', nome: 'João', perfil: 'vendedor', vendedor_id: 'v1' })
    render(await EditarClientePage({ params }))
    const props = mockFormProps.mock.calls[0][0]
    expect(props.mostrarVitalicio).toBe(false)
    expect(props.cliente.comissao).toBeNull()
    expect(props.cliente.fase_cliente).toBe('ativo')
    expect(props.cliente.vitalicio_valor_estimado).toBeNull()
    expect(props.cliente.vitalicio_dia_previsto).toBeNull()
    expect(props.cliente.vitalicio_inicio).toBeNull()
    expect(props.cliente.nome).toBe('Maria Souza')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/EditarClientePage.test.tsx`
Expected: FAIL — hoje a página não passa `mostrarVitalicio` nem apaga campos.

- [ ] **Step 3: Write the implementation**

`src/app/(protected)/clientes/[id]/editar/page.tsx` — arquivo completo:

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'
import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: cliente } = await supabase.from('clientes').select('*').eq('id', id).single()

  if (!cliente) notFound()

  const usuario = await getUsuarioAtual()
  const isAdmin = usuario?.perfil === 'admin'

  if (!isAdmin) {
    // Valores da corretora e vitalício não saem do servidor pro vendedor
    cliente.comissao = null
    cliente.fase_cliente = 'ativo'
    cliente.vitalicio_valor_estimado = null
    cliente.vitalicio_dia_previsto = null
    cliente.vitalicio_inicio = null
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Editar Cliente</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>{cliente.nome}</p>
      </div>
      <ClienteFormPosVenda cliente={cliente} mostrarVitalicio={isAdmin} />
    </div>
  )
}
```

`src/app/(protected)/clientes/novo/page.tsx` — a página já chama `getUsuarioAtual()` (const `usuario`). Só trocar a linha do form:

```tsx
<ClienteFormPosVenda vendedorAtual={vendedorAtual} leadPrefill={leadPrefill} mostrarVitalicio={usuario?.perfil === 'admin'} />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/EditarClientePage.test.tsx`
Expected: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add "src/app/(protected)/clientes/[id]/editar/page.tsx" "src/app/(protected)/clientes/novo/page.tsx" __tests__/EditarClientePage.test.tsx
git commit -m "feat(clientes): servidor nao envia comissao/vitalicio pro vendedor

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Verificação final

**Files:** nenhum novo.

- [ ] **Step 1: Rodar a suíte inteira**

Run: `npx jest`
Expected: todos os testes passam (nenhum pré-existente quebrado).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build limpo, sem erro de tipo (atenção ao `Partial<ClienteInsert>` da Task 2).

- [ ] **Step 3: Confirmar que nada não relacionado foi staged**

Run: `git status`
Expected: único arquivo modificado fora dos commits é `src/app/api/chat/route.ts` (pendência antiga, NÃO commitar).
