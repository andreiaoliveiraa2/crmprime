# Módulo Agenda — Design

**Data:** 2026-05-19  
**Status:** Aprovado

## Banco de dados

```sql
CREATE TABLE agenda (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  data_hora timestamptz NOT NULL,
  tipo text NOT NULL DEFAULT 'Reunião',
  status text NOT NULL DEFAULT 'Agendado',
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  observacoes text,
  criado_em timestamptz DEFAULT now()
);
```

## Tipos

- Reunião, Ligação, Follow-up, Visita, Envio de Proposta, Implantação, Retorno, Outro
- Status: Agendado, Concluído, Cancelado

## Cores por tipo

Reunião=#2d1f4e, Ligação=#1d4ed8, Follow-up=#b89a6a, Visita=#15803d,
Envio de Proposta=#c2410c, Implantação=#6b7280, Retorno=#be185d, Outro=#9a918a

## Página `/agenda`

Toggle Dia / Semana / Mês + botão "Novo Compromisso"

- **Dia:** lista cronológica com horário na esquerda
- **Semana:** 7 colunas (seg–dom) com eventos em cada dia
- **Mês:** grade 6×7 com dots por evento, clique abre os eventos do dia

## EventoModal

Campos: Título, Data, Hora, Tipo (dropdown), Status, Lead ou Cliente relacionado (dropdown), Observações

## Dashboard — Lembretes

- Card "Hoje" com próximos compromissos
- Badge vermelho em compromissos em < 1 hora
- Pendências de dias anteriores (status Agendado com data passada)

## Sidebar

Badge com contagem de compromissos do dia no item "Agenda"

## Componentes

- `AgendaClient.tsx` — gerencia visão e estado
- `AgendaDia.tsx`, `AgendaSemana.tsx`, `AgendaMes.tsx` — views
- `EventoModal.tsx` — criar/editar
- Dashboard: bloco de lembretes
- Sidebar: badge dinâmico
