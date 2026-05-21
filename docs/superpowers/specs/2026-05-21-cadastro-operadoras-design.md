# Cadastro Completo de Operadoras

**Data:** 2026-05-21

## Objetivo

Substituir o cadastro simples de operadoras (só nome + ativo) por um cadastro completo com dados da empresa, regras de comissão e repasse por nível de vendedor. Quando o cliente for salvo como Ativo, o financeiro calcula tudo automaticamente a partir das regras configuradas na operadora.

---

## Banco de Dados

### 1. Alterar tabela `operadoras`

Adicionar colunas:

```sql
ALTER TABLE operadoras
  ADD COLUMN cnpj            text,
  ADD COLUMN telefone        text,
  ADD COLUMN email_gestor    text,
  ADD COLUMN site            text,
  ADD COLUMN empresa         text,   -- 'A2 Prime' | 'A2 Corretora' | 'MEI Alessandro'
  ADD COLUMN observacoes     text;
-- coluna 'ativo' já existe (usada como status Ativa/Inativa)
```

### 2. Alterar tabela `regras_comissao`

Adicionar colunas:

```sql
ALTER TABLE regras_comissao
  ADD COLUMN desconta_imposto   boolean DEFAULT false,
  ADD COLUMN percentual_imposto numeric DEFAULT 0;
-- percentual_total, num_parcelas, percentual_vitalicio, ativo já existem
-- percentual_vitalicio já existe — adicionar coluna tem_vitalicio bool para UI
ALTER TABLE regras_comissao
  ADD COLUMN tem_vitalicio boolean GENERATED ALWAYS AS (percentual_vitalicio > 0) STORED;
-- ou simplesmente calcular na UI: tem_vitalicio = percentual_vitalicio > 0
```

### 3. Nova tabela `repasse_grupo_vendedor`

```sql
CREATE TABLE repasse_grupo_vendedor (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regra_id   uuid REFERENCES regras_comissao(id) ON DELETE CASCADE,
  nivel      text NOT NULL,   -- 'Iniciante' | 'Experiente' | 'VIP' (mesmo valor de vendedores.nivel)
  percentual numeric NOT NULL DEFAULT 0,
  UNIQUE(regra_id, nivel)
);
```

### 4. Tabela `parcelas_regra`

Mantida para dados existentes. Novos cadastros não precisam mais de `percentual_vendedor` (grupo substitui). O campo `percentual_empresa` também deixa de ser necessário — a empresa sempre fica com `100% - grupo%`. Tabela mantida sem alterações para não quebrar dados antigos.

---

## Cálculo de Comissões (novo modelo)

```
valor_parcela  = valor_plano × (percentual_total / 100) / num_parcelas
valor_vendedor = valor_parcela × (nivel_percentual / 100)
valor_empresa  = valor_parcela × ((100 - nivel_percentual) / 100)

Se desconta_imposto:
  valor_empresa = valor_empresa × (1 - percentual_imposto / 100)

Vitalício (mensal, começa após última parcela, só empresa):
  valor_vitalicio = valor_plano × (percentual_vitalicio / 100)
```

O nível do vendedor (`vendedores.nivel`) é buscado em `repasse_grupo_vendedor` filtrando por `regra_id` da operadora e `nivel` do vendedor. Se o vendedor não tiver nível definido ou a operadora não tiver repasse configurado, `valor_vendedor = 0` e empresa fica com tudo.

---

## UI — Rotas

| Rota | Descrição |
|---|---|
| `/gestao/operadoras` | Lista de operadoras (cards com nome, empresa, status) |
| `/gestao/operadoras/nova` | Formulário novo |
| `/gestao/operadoras/[id]` | Editar operadora existente |

A seção **OperadorasSection** em Configurações é removida.
O modal **RegraComissaoModal** em Financeiro é removido (regras ficam na operadora).

---

## Formulário da Operadora — 3 Seções

### Seção 1 — Dados da Operadora
- Nome* (obrigatório)
- CNPJ
- Telefone / WhatsApp
- E-mail do gestor
- Site
- Empresa (select: A2 Prime / A2 Corretora / MEI Alessandro)
- Observações / Material de apoio (textarea)
- Status (toggle Ativa / Inativa)

### Seção 2 — Regras de Comissão
- % Total pago pela operadora (ex: 300)
- Número de parcelas (ex: 3)
- Desconta imposto? (toggle Sim/Não) → se Sim: % do imposto
- Tem vitalício? (toggle Sim/Não) → se Sim: % vitalício mensal

### Seção 3 — Repasse por Nível do Vendedor
Três campos fixos (% que o vendedor recebe de cada parcela):
- Iniciante: X%
- Experiente: Y%
- VIP: Z%

---

## Navegação

Adicionar item "Operadoras" no menu de Gestão (abaixo de Vendedores ou como sub-item).

---

## Vendedores — Nível

Para que o cálculo funcione, o vendedor precisa ter um campo `grupo` ('Iniciante' / 'Experiente' / 'VIP'). Verificar se esse campo já existe na tabela `vendedores`. Se não existir, adicionar via migration.

---

## Migração de Dados Existentes

- Operadoras existentes: mantidas, novos campos ficam `null`
- Regras de comissão existentes: mantidas, `desconta_imposto = false`, `percentual_imposto = 0`
- `parcelas_regra` existente: mantida, não alterada
- `repasse_grupo_vendedor`: tabela vazia inicialmente — usuário cadastra os repassess ao editar cada operadora

---

## Componentes a Criar / Alterar

| Arquivo | Ação |
|---|---|
| `src/app/(protected)/gestao/operadoras/page.tsx` | Criar — lista |
| `src/app/(protected)/gestao/operadoras/nova/page.tsx` | Criar — form novo |
| `src/app/(protected)/gestao/operadoras/[id]/page.tsx` | Criar — form editar |
| `src/components/OperadoraForm.tsx` | Criar — formulário completo |
| `src/components/OperadorasSection.tsx` | Remover do Configurações |
| `src/components/RegraComissaoModal.tsx` | Remover (regras vão para OperadoraForm) |
| `src/components/ComissoesTab.tsx` | Ajustar — remover botão de criar/editar regra |
| `src/lib/types.ts` | Atualizar Operadora, RegraComissao; criar RepasseGrupo |
| `src/lib/gerarComissoes.ts` (ou inline) | Atualizar cálculo para usar grupo do vendedor |
| `supabase/migrations/` | Nova migration com ALTER TABLE e CREATE TABLE |
| Nav/sidebar | Adicionar link Operadoras em Gestão |
