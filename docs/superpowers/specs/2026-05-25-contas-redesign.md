# Redesign da Aba Contas — Estilo Conta Azul

**Data:** 2026-05-25  
**Status:** Aprovado pela usuária

---

## Objetivo

Redesenhar a seção Contas do módulo Financeiro para ter uma lista unificada estilo Conta Azul, com suporte a contas únicas, parceladas e recorrentes, e gerenciamento de categorias nas Configurações.

---

## Decisões de Design

### 1. Layout — Abas Internas

A seção Contas passa a ter **duas sub-abas internas**: "A Pagar" e "A Receber".

- Cada aba tem filtros no topo: Status, Categoria, Empresa, De/Até + botão Limpar
- Cada aba tem botões no cabeçalho: Excel + PDF/Imprimir + Adicionar
- Tabela com colunas: Descrição, Categoria, Valor, Vencimento, Status, Empresa, Ações
- Ações por linha: Editar (lápis) + Excluir (lixeira) + Botão de status (Pagar / Receber)

**A Pagar** — qualquer saída de dinheiro: aluguel, internet, contador, retirada de sócio, etc. Campo Empresa = qual CNPJ da corretora está pagando.

**A Receber** — entradas sempre ligadas a CNPJ/operadora. A Descrição identifica a operadora e qual CNPJ pertence (ex: "Bradesco - CNPJ 01"). Campo Empresa = qual CNPJ recebe.

A seção de **Despesas Fixas é removida** da tela — substituída pelo tipo "Recorrente" no formulário.

As seções de **comissões** (vendedores e operadoras) permanecem inalteradas acima das contas.

---

### 2. Formulário de Nova/Editar Conta

Modal unificado. O tipo de aba (A Pagar / A Receber) pré-define o `tipo` da conta.

**Campos:**

| Campo | Tipo | Obrigatório | Detalhe |
|---|---|---|---|
| Descrição | Texto | Sim | Livre |
| Tipo | Select | Sim | Única / Parcelada / Recorrente |
| Valor | Número | Sim | Valor por parcela ou mensal |
| Vencimento | Data | Sim | Data do 1º lançamento |
| Categoria | Select | Não | Lista das Configurações |
| Empresa | Select | Não | CNPJs cadastrados |
| Observações | Textarea | Não | — |

**Campos extras por tipo:**

- **Única** → nenhum campo extra. Cria 1 entrada em `contas`.
- **Parcelada** → campo "Nº de parcelas" (número inteiro). Cria N entradas em `contas` com datas em meses consecutivos. Na descrição de cada entrada adiciona " — X/N" (ex: "Material escritório — 1/3").
- **Recorrente** → campo "Dia do mês" (1–28). Cria uma entrada em `despesas_fixas` (tabela existente) e gera imediatamente o lançamento do mês atual em `contas`. Os meses seguintes são gerados automaticamente pela lógica já existente no ContasTab.

**Auto-preenchimento de Tipo:** se a categoria selecionada tiver `tipo_padrao` configurado, o campo Tipo é pré-selecionado automaticamente (mas pode ser alterado).

---

### 3. Categorias nas Configurações

Nova seção "Categorias" na página de Configurações (ao lado de Usuários, Operadoras, CNPJs).

**Cada categoria:**
- Nome (obrigatório, único)
- Tipo padrão: Única ou Recorrente (sugestão, não obriga no formulário)
- Ativo (boolean, para desativar sem excluir)

**Operações:** Adicionar, Editar (nome + tipo_padrao), Desativar/Ativar, Excluir (só se sem contas vinculadas).

**Categorias padrão existentes** são mantidas e recebem `tipo_padrao`:
- Aluguel → Recorrente
- Internet → Recorrente
- Telefone → Recorrente
- Contador → Recorrente
- Sistema → Recorrente
- Salário → Recorrente
- Imposto → Única
- Outros → Única

---

## Mudanças no Banco de Dados

### Tabela `contas` — novas colunas

```sql
alter table contas
  add column if not exists tipo_lancamento text not null default 'unica'
    check (tipo_lancamento in ('unica', 'parcelada', 'recorrente')),
  add column if not exists grupo_id        uuid,
  add column if not exists parcela_numero  integer,
  add column if not exists total_parcelas  integer;
```

- `tipo_lancamento`: identifica a origem do lançamento
- `grupo_id`: UUID compartilhado entre parcelas do mesmo grupo (parceladas)
- `parcela_numero` / `total_parcelas`: ex: 2 / 3

### Tabela `categorias_despesa` — nova coluna

```sql
alter table categorias_despesa
  add column if not exists tipo_padrao text not null default 'unica'
    check (tipo_padrao in ('unica', 'recorrente'));
```

---

## O que NÃO muda

- Tabela `despesas_fixas` — mantida como backing store para recorrentes
- Lógica de geração mensal automática de contas a partir de despesas_fixas — mantida
- Seção de Comissões Vendedores — inalterada
- Seção de Comissões a Receber (Operadora) — inalterada
- Summary Cards no topo da aba Contas — inalterados
- Exportação Excel/PDF — mantida e expandida para ambas as abas

---

## Componentes Afetados

| Arquivo | O que muda |
|---|---|
| `src/components/ContasTab.tsx` | Reescrever ContasPagarSection + ContasReceberSection → novo ContasUnificadasSection com sub-abas; atualizar ContaModal; remover DespesasFixasSection |
| Página de Configurações | Adicionar seção Categorias com CRUD completo |
| `supabase/migrations/` | Nova migration com as alterações de schema acima |

---

## Regras de Edição e Exclusão

**Parcelada:**
- Editar uma parcela → afeta só aquela entrada (edição individual)
- Excluir uma parcela → exclui só aquela entrada; as demais do grupo permanecem
- Não existe "editar todas as parcelas" na v1

**Recorrente:**
- Editar o valor/dia → atualiza a `despesa_fixa` (afeta meses futuros) + atualiza o lançamento do mês atual se ainda Pendente
- Excluir → desativa a `despesa_fixa` (para de gerar) e exclui o lançamento do mês atual se ainda Pendente; lançamentos já Pagos são preservados

---

## Fora de Escopo

- Relatórios avançados por categoria (pode ser feito depois)
- Aprovação de pagamentos (fluxo multi-usuário)
- Integração com banco/conciliação automática
