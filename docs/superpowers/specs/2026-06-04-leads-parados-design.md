# Alerta de Leads Parados

**Data:** 2026-06-04  
**Status:** Aprovado

## Contexto

Leads que ficam dias sem movimentação somem na lista sem aviso. O time pode perder negócios por não perceber que um lead ficou parado. A solução é um indicador visual discreto nos dois modos de visualização do CRM (Kanban e Lista) quando um lead não teve nenhuma atualização há 5 ou mais dias.

## Critério de "parado"

Um lead é considerado parado quando:
- `atualizado_em` (ou `criado_em` como fallback) tem 5 ou mais dias
- A etapa **não** é `Vendido` nem `Perdido` — leads encerrados nunca são marcados como parados

## Banco de dados

### Migration: `20260604_leads_atualizado_em.sql`

```sql
alter table leads add column atualizado_em timestamptz default now();
update leads set atualizado_em = criado_em;

create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_leads_atualizado_em
  before update on leads
  for each row execute function set_atualizado_em();
```

O trigger Postgres garante que `atualizado_em` é atualizado automaticamente em qualquer UPDATE na tabela `leads`, sem depender do código da aplicação.

## Tipo Lead

Adicionar campo em `src/lib/types.ts`:

```ts
export interface Lead {
  // ... campos existentes ...
  atualizado_em: string  // novo campo
}
```

`LeadInsert` também precisa omitir `atualizado_em` (o trigger o preenche automaticamente):

```ts
export type LeadInsert = Omit<Lead, 'id' | 'criado_em' | 'atualizado_em'> & { criado_em?: string | null }
```

## Lógica utilitária

Novo arquivo `src/lib/leads.ts`:

```ts
export function diasParado(lead: Lead): number {
  const ref = lead.atualizado_em ?? lead.criado_em
  return Math.floor((Date.now() - new Date(ref).getTime()) / 86_400_000)
}

export function isParado(lead: Lead): boolean {
  return diasParado(lead) >= 5
    && lead.etapa !== 'Vendido'
    && lead.etapa !== 'Perdido'
}
```

## Visual

**Indicador:** ícone `Clock` (lucide-react) + badge laranja discreta  
**Cores:** fundo `#fff7ed`, texto/ícone `#ea580c`  
**Threshold:** 5 dias

### Kanban (`KanbanBoard.tsx`)

No card do lead, quando `isParado(lead)` for verdadeiro:
- Badge no canto superior direito do card com ícone `Clock` (size 13) e texto `"X dias"`
- Não altera o layout do card — apenas sobrepõe o badge

### Lista (`LeadTable.tsx`)

Na coluna do nome, quando `isParado(lead)` for verdadeiro:
- Badge inline ao lado do nome: ícone `Clock` + `"X dias"`
- Mesmo estilo visual do Kanban

## Arquivos a modificar

| Arquivo | Tipo de mudança |
|---|---|
| `supabase/migrations/20260604_leads_atualizado_em.sql` | Novo — migration + trigger |
| `src/lib/types.ts` | Adicionar `atualizado_em: string` no tipo `Lead` |
| `src/lib/leads.ts` | Novo — funções `diasParado` e `isParado` |
| `src/components/KanbanBoard.tsx` | Badge no card quando parado |
| `src/components/LeadTable.tsx` | Badge na linha quando parado |

## Fora de escopo

- Configuração do threshold (fixo em 5 dias)
- Notificação por email/push quando lead para
- Filtro "mostrar só parados" na lista
- Histórico de movimentações do lead
