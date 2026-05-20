# Cadastro de Cliente — Campos Expandidos + Documentos
**Data:** 2026-05-20
**Status:** Aprovado

---

## Objetivo

Expandir o formulário de cadastro de cliente com novos campos de plano, dados comerciais (comissão por percentual, vitalício, corretora) e upload de documentos. Os novos campos de comissão alimentam automaticamente o módulo Financeiro ao salvar o cliente.

---

## Banco de Dados

### Novos campos na tabela `clientes`

```sql
-- Dados do Plano
alter table clientes
  add column if not exists data_inicio_plano date,
  add column if not exists data_vencimento_plano date,
  add column if not exists coparticipacao boolean default false,
  add column if not exists tipo_acomodacao text,
  add column if not exists abrangencia text,
  add column if not exists carencia boolean default false;

-- Dados Comerciais
alter table clientes
  add column if not exists forma_pagamento text,
  add column if not exists dia_vencimento_boleto integer,
  add column if not exists corretora_responsavel text,
  add column if not exists percentual_comissao_corretora numeric,
  add column if not exists percentual_comissao_vendedor numeric,
  add column if not exists tem_vitalicio boolean default false,
  add column if not exists percentual_vitalicio numeric;
```

Valores válidos (check constraints opcionais, não bloqueantes):
- `tipo_acomodacao`: 'Enfermaria' | 'Apartamento' | 'UTI'
- `abrangencia`: 'Municipal' | 'Estadual' | 'Nacional'
- `forma_pagamento`: 'Boleto' | 'Débito' | 'Cartão' | 'Desconto em Folha'
- `corretora_responsavel`: 'A2 Prime' | 'A2 Corretora' | 'MEI Alessandro'

### Tabela `documentos_cliente`

```sql
create table if not exists documentos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  tipo text not null check (tipo in ('Contrato','Proposta','RG','CNH','Outro')),
  nome_arquivo text not null,
  storage_path text not null,
  tamanho_bytes integer,
  criado_em timestamptz not null default now()
);
```

### Supabase Storage

Bucket: `clientes-documentos` (privado). Criado via dashboard do Supabase ou SQL:
```sql
insert into storage.buckets (id, name, public)
values ('clientes-documentos', 'clientes-documentos', false)
on conflict do nothing;
```

Path de cada arquivo: `{cliente_id}/{uuid}-{nome_original}`

---

## Formulário — ClienteFormPosVenda

### Dados do Plano (expandido)

Adicionar ao grid existente:
- Data de início do plano (`data_inicio_plano`) + Data de vencimento (`data_vencimento_plano`) — lado a lado
- Coparticipação (`coparticipacao`) + Carência (`carencia`) — toggles Sim/Não lado a lado
- Tipo de acomodação (`tipo_acomodacao`) — select: Enfermaria / Apartamento / UTI
- Abrangência (`abrangencia`) — select: Municipal / Estadual / Nacional

### Dados Comerciais (reestruturado)

Ordem dos campos:
1. Vendedor (já existe)
2. Corretora responsável (`corretora_responsavel`) — select: A2 Prime / A2 Corretora / MEI Alessandro
3. Forma de pagamento (`forma_pagamento`) — select: Boleto / Débito / Cartão / Desconto em Folha
4. Dia de vencimento do boleto (`dia_vencimento_boleto`) — número 1–31, visível **só se** forma_pagamento = 'Boleto'
5. % Comissão da corretora + % Comissão do vendedor — lado a lado
6. Tem vitalício (`tem_vitalicio`) — toggle Sim/Não
7. % Vitalício (`percentual_vitalicio`) — visível **só se** tem_vitalicio = true
8. Observações (existente, mantido no fim)

### Documentos (nova seção, somente em modo edição)

- Lista de documentos existentes: badge do tipo + nome do arquivo + botão download + botão excluir
- Botão "+ Adicionar Documento" abre mini-modal:
  - Select do tipo (Contrato / Proposta / RG / CNH / Outro)
  - Input de arquivo (aceita PDF, JPG, PNG, DOCX, máx 10 MB)
  - Botão "Enviar"
- Upload via Supabase Storage (`supabase.storage.from('clientes-documentos').upload(...)`)
- Após upload: insere registro em `documentos_cliente`
- Download: `supabase.storage.from('clientes-documentos').createSignedUrl(path, 3600)`
- Exclusão: remove de `documentos_cliente` + `storage.remove([path])`

---

## Integração com Financeiro

### Lógica ao salvar cliente com `valor_plano`

Já existe: cria/atualiza registro em `vendas`.

**Novo: geração de `comissoes`**

Ao criar/atualizar a venda, verificar se o cliente tem percentuais próprios:

**Se `percentual_comissao_corretora` > 0 OU `percentual_comissao_vendedor` > 0:**
- Usar percentuais do cliente diretamente
- Deletar comissoes existentes para essa venda (tipo='parcela') e recriar:
  - 1 registro `tipo='parcela'`, `numero_parcela=1`
  - `valor_empresa = valor_plano × (percentual_comissao_corretora / 100)`
  - `valor_vendedor = valor_plano × (percentual_comissao_vendedor / 100)`
  - `valor_bruto = valor_empresa + valor_vendedor`
  - `data_prevista = data_venda` (ou hoje)

**Else (sem percentuais próprios):**
- Fallback: buscar `regras_comissao` para a operadora (comportamento existente em RegistrarVendaModal)

**Vitalício (`tem_vitalicio = true` e `percentual_vitalicio > 0`):**
- Deletar comissao existente tipo='vitalicio' para essa venda e recriar:
  - `tipo='vitalicio'`, `numero_parcela=null`
  - `valor_bruto = valor_plano × (percentual_vitalicio / 100)`
  - Split: empresa = valor_bruto × (percentual_comissao_corretora / (percentual_comissao_corretora + percentual_comissao_vendedor)), ou 100% empresa se vendedor = 0
  - `data_prevista = data_venda + 1 mês`

---

## TypeScript — novos campos no tipo `Cliente`

```typescript
// Adicionar ao interface Cliente:
data_inicio_plano: string | null
data_vencimento_plano: string | null
coparticipacao: boolean | null
tipo_acomodacao: string | null
abrangencia: string | null
carencia: boolean | null
forma_pagamento: string | null
dia_vencimento_boleto: number | null
corretora_responsavel: string | null
percentual_comissao_corretora: number | null
percentual_comissao_vendedor: number | null
tem_vitalicio: boolean | null
percentual_vitalicio: number | null

// Nova interface:
interface DocumentoCliente {
  id: string
  cliente_id: string
  tipo: 'Contrato' | 'Proposta' | 'RG' | 'CNH' | 'Outro'
  nome_arquivo: string
  storage_path: string
  tamanho_bytes: number | null
  criado_em: string
}
```

---

## Componentes

```
src/components/
  ClienteFormPosVenda.tsx    ← expandir campos + integração comissoes
  DocumentosCliente.tsx      ← nova seção de documentos (somente edit)
  AdicionarDocumentoModal.tsx ← mini-modal de upload
```

---

## Fora do escopo

- Pré-visualização de documentos no browser
- Controle de versão de documentos
- Notificações de vencimento do plano
- Permissões por usuário para documentos
