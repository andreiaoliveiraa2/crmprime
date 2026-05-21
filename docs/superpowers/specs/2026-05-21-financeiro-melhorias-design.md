# Spec: Melhorias do Módulo Financeiro

**Data:** 2026-05-21
**Status:** Aprovado

---

## Contexto

O módulo Financeiro tem 4 abas: Produção, Comissões, Contas, Relatórios. A estrutura de dados usa as tabelas `vendas`, `comissoes`, `contas`, `regras_comissao` e `parcelas_regra`. Clientes são cadastrados separadamente em `clientes`.

As 3 empresas (A2 Prime, A2 Corretora, MEI Alessandro) compartilham a mesma equipe de vendedores — não são filiais, são CNPJs distintos. Vendedores são cadastro único, não vinculados a empresa específica.

---

## Escopo

### 1. Produção — somente leitura

A aba Produção exibe apenas dados vindos do cadastro de clientes. Não existe — e não deve existir — botão de registro manual de venda nessa aba. A única fonte de dados da tabela `vendas` é o fluxo automático descrito abaixo.

### 2. Integração automática Clientes → Produção

**Regra de negócio:**
- Ao salvar um cliente (criação ou edição), o app verifica se os campos `status`, `valor_plano`, `operadora` e `vendedor` estão preenchidos.
- Se `status = "Ativo"` e os três campos estão preenchidos → cria ou atualiza uma linha em `vendas` com `origem = 'cliente'`.
- Se `status = "Cancelado"` e existe uma venda vinculada (`cliente_id`) → atualiza `vendas.status = 'Cancelado'`.
- Se `status = "Inativo"` → não cria venda nova; se já existia venda, mantém como está (não altera status da venda).
- O campo `empresa` da venda é derivado de `clientes.corretora_responsavel`.

**Como identificar a venda do cliente:**
- A coluna `vendas.cliente_id` já existe. Ao criar uma venda automática, salvar o `cliente_id`.
- Antes de inserir, fazer SELECT por `cliente_id` para verificar se já existe venda — se existir, fazer UPDATE; se não, INSERT.

**O que não muda:**
- Vendas com `origem = 'manual'` (se existirem) não são afetadas.
- A sincronização é silenciosa — nenhuma tela extra, nenhuma confirmação para o usuário.

**Onde implementar:**
- `src/app/(protected)/clientes/novo/page.tsx` — após o `supabase.from('clientes').insert()`
- `src/app/(protected)/clientes/[id]/editar/page.tsx` — após o `supabase.from('clientes').update()`
- Extrair a lógica para `src/lib/sincronizarVenda.ts` para reutilizar nos dois lugares.

### 3. Campo Empresa

**Tabelas afetadas:** `vendas`, `comissoes`, `contas`

**Migrations Supabase (3 alterações):**
```sql
ALTER TABLE vendas     ADD COLUMN IF NOT EXISTS empresa text;
ALTER TABLE comissoes  ADD COLUMN IF NOT EXISTS empresa text;
ALTER TABLE contas     ADD COLUMN IF NOT EXISTS empresa text;
```

**Como o campo é populado:**

| Tabela | Como entra |
|--------|-----------|
| `vendas` | Automático — copiado de `clientes.corretora_responsavel` na sincronização |
| `comissoes` | Automático — copiado de `vendas.empresa` quando comissões são geradas |
| `contas` | Manual — selecionado pelo usuário no ContaModal (campo obrigatório) |

**Valores válidos:** `'A2 Prime'`, `'A2 Corretora'`, `'MEI Alessandro'`

**Constante a adicionar em `src/lib/types.ts`:**
```ts
export const EMPRESAS = ['A2 Prime', 'A2 Corretora', 'MEI Alessandro'] as const
export type Empresa = typeof EMPRESAS[number]
```

**Atualização dos tipos:**
- `Venda`: adicionar `empresa: string | null`
- `Comissao`: adicionar `empresa: string | null`
- `Conta`: adicionar `empresa: string | null`

**Filtro por empresa nas abas:**
- Produção, Comissões, Contas e Relatórios ganham filtro: `Todas as empresas | A2 Prime | A2 Corretora | MEI Alessandro`
- Relatórios: padrão é "Todas as empresas" (consolidado)

### 4. Comissão separada — Corretora vs Vendedor

A estrutura de dados já possui `valor_empresa` e `valor_vendedor` em cada `Comissao`. As mudanças são na camada de exibição:

**Tabela de Comissões:**
- Substituir coluna única "Valor" por duas colunas: **Corretora** (`valor_empresa`) e **Vendedor** (`valor_vendedor`)
- Linhas de tipo `vitalicio`: coluna Vendedor mostra `R$ 0,00` com badge "Vitalício · Só Corretora"

**Cards de resumo (topo da aba Comissões):**
- Card "A receber (Corretora)" — soma de `valor_empresa` com `status_empresa = 'Pendente'`
- Card "A pagar (Vendedores)" — soma de `valor_vendedor` com `status_vendedor = 'Pendente'`

**Regra de negócio exibida:** vitalício é exclusivo da corretora — `valor_vendedor` sempre zero em comissões do tipo `vitalicio`. Essa regra já deve ser aplicada na geração das comissões (RegraComissaoModal), mas a UI deve reforçá-la visualmente.

---

## Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `src/lib/types.ts` | Adicionar `EMPRESAS`, `Empresa`; adicionar `empresa` em `Venda`, `Comissao`, `Conta` |
| `src/lib/sincronizarVenda.ts` | **Criar** — função que sincroniza cliente → venda |
| `src/app/(protected)/clientes/novo/page.tsx` | Chamar `sincronizarVenda` após salvar |
| `src/app/(protected)/clientes/[id]/editar/page.tsx` | Chamar `sincronizarVenda` após salvar |
| `src/components/ContasTab.tsx` | Adicionar campo Empresa no ContaModal; filtro por empresa |
| `src/components/ProducaoTab.tsx` | Adicionar filtro por empresa; garantir sem botão manual |
| `src/components/ComissoesTab.tsx` | Colunas separadas Corretora/Vendedor; filtro empresa; cards separados |
| `src/components/RelatoriosTab.tsx` | Filtro por empresa (consolidado por padrão) |
| `src/app/(protected)/financeiro/page.tsx` | Sem alteração estrutural — pode precisar passar `empresa` nos dados |

---

## O que não está no escopo

- Migração de dados históricos existentes (comissões e contas antigas ficam com `empresa = null` — os filtros tratam `null` como "sem empresa definida")
- Relatórios financeiros por empresa além do filtro (análise por empresa em gráfico fica para versão futura)
- Qualquer mudança na tela de Gestão de Vendedores (vendedores continuam cadastro único)
