# CNPJs de Recebimento — Design

**Data:** 2026-05-22

## Objetivo

Substituir o array hardcoded `EMPRESAS = ['A2 Prime', 'A2 Corretora', 'MEI Alessandro']` por um cadastro dinâmico de "CNPJs / Contas de Recebimento". Permitir que a mesma operadora seja cadastrada em mais de um CNPJ, com regras de comissão independentes por combinação. Tornar o CNPJ de recebimento um campo obrigatório no registro de venda.

---

## Contexto

A operação comercial é uma só (A2 Prime), mas existem 3 CNPJs usados para recebimento financeiro:
- **A2 Corretora de Seguros**
- **A2 Prime**
- **MEI**

Esses CNPJs não são empresas separadas operacionalmente. Existem apenas para: recebimento de comissão, conta bancária vinculada, controle financeiro e relatórios.

---

## Princípios da Abordagem (Aditiva / Sem quebra de dados)

- Criar nova tabela `cnpjs_recebimento` — os 3 CNPJs existentes viram dados semeados
- Adicionar `cnpj_recebimento_id` em `regras_comissao` e `vendas` (nullable, backward compat)
- Manter colunas `empresa` (texto) existentes para registros antigos
- Remover o campo "Empresa" do formulário de operadoras (coluna `operadoras.empresa` mantida no banco, apenas ocultada da UI)
- Remover constante `EMPRESAS` e tipo `Empresa` de `types.ts` — substituídos por dados dinâmicos

---

## Banco de Dados

### Nova tabela `cnpjs_recebimento`

```sql
CREATE TABLE cnpjs_recebimento (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL,
  razao_social text,
  cnpj         text,
  banco        text,
  agencia      text,
  conta        text,
  tipo_conta   text,   -- 'Corrente' | 'Poupança'
  pix          text,
  status       text NOT NULL DEFAULT 'Ativo',  -- 'Ativo' | 'Inativo'
  criado_em    timestamptz NOT NULL DEFAULT now()
);

-- Dados iniciais
INSERT INTO cnpjs_recebimento (nome) VALUES
  ('A2 Prime'),
  ('A2 Corretora'),
  ('MEI');
```

### Alterações em tabelas existentes

```sql
-- Cada regra agora pertence a (operadora + CNPJ), não só operadora
ALTER TABLE regras_comissao
  ADD COLUMN cnpj_recebimento_id uuid REFERENCES cnpjs_recebimento(id);

-- Venda registra qual CNPJ recebe a comissão
ALTER TABLE vendas
  ADD COLUMN cnpj_recebimento_id uuid REFERENCES cnpjs_recebimento(id);
```

### O que NÃO muda

| Tabela | Campo | Motivo |
|---|---|---|
| `operadoras` | `empresa` (text) | Mantida no banco; removida só da UI |
| `comissoes` | `empresa` (text) | Continua populado com `cnpjs_recebimento.nome` |
| `contas` | `empresa` (text) | Sem alteração |
| `regras_comissao` | `operadora` (text) | Mantida para backward compat com regras antigas |
| `vendas` | `empresa` (text) | Mantida; novos registros também populam com nome do CNPJ |

---

## Configurações — Nova seção "CNPJs / Contas de Recebimento"

### Rota
`/configuracoes` — nova seção abaixo de Operadoras

### UI
Lista de cards (um por CNPJ), botão "Adicionar CNPJ" no topo. Clique no card abre modal de edição.

### Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| Nome | texto | Sim |
| Razão Social | texto | Não |
| CNPJ | texto | Não |
| Banco | texto | Não |
| Agência | texto | Não |
| Conta | texto | Não |
| Tipo de Conta | select: Corrente / Poupança | Não |
| PIX | texto | Não |
| Status | toggle Ativo / Inativo | Sim |

### Regras de negócio
- CNPJs inativos não aparecem no dropdown de "Registrar Venda", mas permanecem visíveis em filtros financeiros históricos
- Não é possível excluir um CNPJ com vendas vinculadas — apenas desativar

---

## Operadoras — Formulário com abas por CNPJ

### Seção 1 — Dados da Operadora
Sem mudanças estruturais. O campo "Empresa" é **removido** do formulário (coluna mantida no banco).

### Seção 2 — Regras de Comissão por CNPJ

A seção de regras passa a ter abas, uma por CNPJ onde a operadora está cadastrada:

```
[A2 Prime] [A2 Corretora]   + Adicionar CNPJ
────────────────────────────────────────────
% Total pago pela operadora: ___
Número de parcelas: ___
Tem vitalício? [Sim] [Não]
Desconta imposto? [Sim] [Não]

Repasse por Nível:
Iniciante: __% | Experiente: __% | VIP: __%
```

### Comportamento das abas
- Cada aba = uma linha em `regras_comissao` com `cnpj_recebimento_id` diferente
- Operadora sem nenhum CNPJ vinculado → seção mostra só o botão "+ Adicionar CNPJ"
- "+ Adicionar CNPJ" → select com CNPJs ativos ainda não vinculados; cria aba com campos zerados
- Cada aba tem botão "Remover vínculo" (bloqueado se já houver vendas com essa combinação)
- Salvar: cada aba grava/atualiza sua linha em `regras_comissao` com o par `(operadora, cnpj_recebimento_id)`

### Listagem de Operadoras (`/gestao/operadoras`)
Cada card exibe tags dos CNPJs onde a operadora está cadastrada (ex: `A2 Prime` `A2 Corretora`). Se nenhum: "Sem regras".

---

## Registrar Venda — Campo CNPJ de Recebimento

Novo campo obrigatório no modal `RegistrarVendaModal`, logo após o campo Operadora.

### Fluxo
1. Usuário seleciona **Operadora**
2. Campo "CNPJ de Recebimento" filtra para mostrar apenas CNPJs onde essa operadora tem regra
3. **1 CNPJ disponível** → auto-seleciona
4. **2+ CNPJs** → usuário escolhe no dropdown
5. **Nenhum** → campo bloqueado com aviso: "Esta operadora não tem regras cadastradas. Configure em Gestão → Operadoras."

### Busca da regra
```sql
SELECT * FROM regras_comissao
WHERE operadora = :nome
  AND cnpj_recebimento_id = :cnpj_id
  AND ativo = true
LIMIT 1
```

### Salvamento
- `vendas.cnpj_recebimento_id` = id selecionado
- `vendas.empresa` = `cnpjs_recebimento.nome` (compatibilidade)
- `comissoes.empresa` = `cnpjs_recebimento.nome` (compatibilidade com filtros)

---

## Financeiro e Relatórios

### Filtros por CNPJ
Os selects "Todos / A2 Prime / A2 Corretora / MEI" nos tabs de Produção, Comissões, Contas e Relatórios passam a ser **dinâmicos**, lendo de `cnpjs_recebimento`. Padrão: "Todos" (visão consolidada).

### Área do vendedor
Sem mudanças. CNPJ é informação interna — vendedor não visualiza.

---

## Código — Arquivos Afetados

| Arquivo | Mudança |
|---|---|
| `src/lib/types.ts` | Remover `EMPRESAS`, `Empresa`; adicionar tipo `CnpjRecebimento` |
| `src/lib/useCnpjsRecebimento.ts` | Criar hook (retorna lista ativa) |
| `src/lib/useOperadoras.ts` | Sem mudança — continua retornando nomes |
| `src/app/(protected)/configuracoes/page.tsx` | Adicionar seção CNPJs |
| `src/components/CnpjRecebimentoSection.tsx` | Criar — lista + modal de cadastro |
| `src/components/OperadoraForm.tsx` | Remover campo Empresa; adicionar abas por CNPJ (ver nota abaixo) |
| `src/app/(protected)/gestao/operadoras/page.tsx` | Tags de CNPJs nos cards |
| `src/components/RegistrarVendaModal.tsx` | Novo campo CNPJ de Recebimento |
| `src/components/ComissoesTab.tsx` | Filtro empresa → dinâmico |
| `src/components/ContasTab.tsx` | Filtro empresa → dinâmico |
| `src/components/ProducaoTab.tsx` | Filtro empresa → dinâmico |
| `src/components/RelatoriosTab.tsx` | Filtro empresa → dinâmico |
| `supabase/migrations/` | Nova migration com CREATE TABLE + ALTER TABLE |

### Nota: `ClienteFormPosVenda.tsx` fora do escopo
Este componente edita o cadastro de clientes — não registra vendas. O campo CNPJ de recebimento pertence ao fluxo de `RegistrarVendaModal`, não ao perfil do cliente.

### Como o modal obtém os CNPJs disponíveis para uma operadora
Ao selecionar uma operadora no modal de venda, o sistema consulta inline:
```sql
SELECT DISTINCT cnpj_recebimento_id FROM regras_comissao
WHERE operadora = :nome AND ativo = true AND cnpj_recebimento_id IS NOT NULL
```
Em seguida, resolve os nomes e contas bancárias via `cnpjs_recebimento`. Lógica inline no `RegistrarVendaModal`, sem hook separado.

---

## Migração de Dados Existentes

- `regras_comissao` existentes: `cnpj_recebimento_id` fica `null` — continuam funcionando para vendas antigas (o modal de venda nova vai exigir o campo)
- `vendas` existentes: `cnpj_recebimento_id` fica `null` — filtros financeiros usam `empresa` (texto) como fallback
- Operadoras existentes: o campo `empresa` no banco fica com o valor antigo, mas não é mais exibido nem editado
- Nenhum dado é apagado ou transformado obrigatoriamente

---

## Componentes a Criar

| Arquivo | Descrição |
|---|---|
| `src/lib/useCnpjsRecebimento.ts` | Hook que lê `cnpjs_recebimento` ativos do Supabase |
| `src/components/CnpjRecebimentoSection.tsx` | Seção de Configurações: lista + modal CRUD |
