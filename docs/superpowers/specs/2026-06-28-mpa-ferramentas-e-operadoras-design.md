# Design: MPA — Ferramentas CRM no WhatsApp + Central das Operadoras

Data: 2026-06-28
Escopo: Item D + Item E do FUSAO-MPA-CRM.md

---

## Visão geral

Dois entregáveis independentes:

- **Item D** — Adicionar ferramentas no `mpa.runner.ts` (AGENTE-CRM) para que o corretor
  consulte agenda, leads, comissões e vendas pelo WhatsApp via linguagem natural.
- **Item E** — Carregar conteúdo das operadoras na knowledge base (WhatsApp responde
  perguntas como "qual a carência de parto da Amil?") + página visual no CRM.

Banco compartilhado: Supabase `lctacientnedmarsbitt`.
LLM: Groq `llama-3.3-70b-versatile`. Embeddings: Google `text-embedding-004`.

---

## Item D — Ferramentas CRM no mpa.runner.ts

### Tabelas CRM relevantes

| Tabela | Campos usados |
|---|---|
| `agenda` | id, titulo, data_hora, tipo, status, observacoes, vendedor_id |
| `leads` | id, nome, telefone, etapa, tipo_plano, operadora, criado_em, observacoes |
| `vendas` | id, cliente_nome, operadora, valor_plano, data_venda, status |
| `comissoes` | id, venda_id, tipo, valor_bruto, status_empresa, data_prevista, data_recebida_empresa |

### Novo arquivo: `AGENTE-CRM/packages/database/src/queries/crm-queries.ts`

Cinco funções exportadas:

```ts
getAgendaItems(supabase, { dataInicio, dataFim })
  → SELECT FROM agenda WHERE data_hora BETWEEN ... ORDER BY data_hora ASC LIMIT 10

getLeads(supabase, { etapas? })
  → SELECT FROM leads WHERE etapa IN (...) ORDER BY criado_em DESC LIMIT 20
  → etapas padrão: ['Novo Lead','Contato Feito','Cotação','Negociação']

getSalesMetrics(supabase, { mes, ano })
  → vendas do mês + total comissões status_empresa='Recebida' no mês
  → comissões pendentes (status_empresa='Pendente')

getComissoes(supabase, { status?, limite? })
  → SELECT FROM comissoes WHERE status_empresa = ... ORDER BY data_prevista ASC

createAgendaItem(supabase, { titulo, data_hora, tipo?, observacoes? })
  → INSERT INTO agenda (titulo, data_hora, tipo, status='Agendado', vendedor_id=null)
```

Adicionar ao `packages/database/src/queries/index.ts`:
```ts
export * from "./crm-queries";
```

### Cinco ferramentas novas no `mpa.runner.ts`

Cada ferramenta fica no objeto `tools` do `generateText`:

**1. `getAgenda`**
- Description: "Consulta compromissos da agenda. Use para 'quais meus compromissos hoje?', 'o que tenho amanhã?', 'minha semana'."
- Input: `{ periodo: 'hoje' | 'amanha' | 'semana' }`
- Execute: calcula dataInicio/dataFim conforme periodo, chama `getAgendaItems`, formata lista

**2. `getLeads`**
- Description: "Lista leads ativos no funil comercial. Use para 'meus leads', 'quem está em negociação?', 'quantos leads tenho?'"
- Input: `{ etapa?: string }` — filtra por etapa específica ou todas as ativas
- Execute: chama `getLeads`, retorna lista formatada com nome, etapa, tipo_plano

**3. `getSalesMetrics`**
- Description: "Métricas de vendas e comissões do mês. Use para 'quanto vendi?', 'minhas comissões', 'resumo do mês'."
- Input: `{}` — sempre mês atual
- Execute: chama `getSalesMetrics` com mês/ano corrente, formata resumo

**4. `createAppointment`**
- Description: "Cria compromisso na agenda. Use para 'agenda reunião quinta 15h', 'marca visita amanhã 10h'."
- Input: `{ titulo: string, data_hora: string, tipo?: string, observacoes?: string }`
  - data_hora em ISO 8601 (o LLM converte da linguagem natural)
- Execute: chama `createAgendaItem`, confirma com "✓ Agendado: [titulo] em [data formatada]"

**5. `getComissoes`**
- Description: "Consulta comissões pendentes ou recebidas. Use para 'o que vou receber?', 'comissões pendentes'."
- Input: `{ status: 'Pendente' | 'Recebida' }`
- Execute: chama `getComissoes`, agrupa por operadora, totaliza

### Parâmetros adicionais no `runMpaAgent`

O `supabase` client já é passado como parâmetro — as funções CRM usam o mesmo client.
Nenhuma mudança de assinatura na função.

### stopWhen

Manter `isStepCount(3)` — suficiente para queries encadeadas.

---

## Item E — Central das Operadoras

### Parte 1: Import na knowledge base

**Novo script: `AGENTE-CRM/scripts/import-operadoras-knowledge.ts`**

Segue o mesmo padrão do `import-mpa-knowledge.ts` existente. Diferenças:

- Lê os 7 arquivos de `docs/mpa-original/operadoras/templates/` no crm-seguros
  (amil.md, bradesco-saude.md, sulamerica.md, hapvida.md, maxmed.md, previmed.md, dental-center.md)
- Também lê `regras-comissao.md`
- Usa o mesmo `chunkText` + `embedBatch` + `createDocument`/`insertChunks`
- Associa ao `MPA_AGENT_ID` (agente MPA: `283791ae-a135-4296-8492-35133398f78a`)

**Var de ambiente necessária:**
```
MPA_AGENT_ID=283791ae-a135-4296-8492-35133398f78a
ORGANIZATION_ID=936b0370-b463-4419-b2ec-c9d8d2296322
GOOGLE_AI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Adicionar ao `package.json` do AGENTE-CRM:**
```json
"import-operadoras": "tsx scripts/import-operadoras-knowledge.ts"
```

**Rodar uma vez após criar o script:**
```bash
pnpm import-operadoras
```

Após o import, o `searchKnowledge` existente no `mpa.runner.ts` já consulta esses chunks
automaticamente — nenhuma mudança no runner necessária para isso.

### Parte 2: Página visual no CRM

**Novo arquivo: `crm-seguros/src/app/(protected)/prime-academy/central-operadoras/page.tsx`**

Server component. Lê os Markdown em build-time com `fs.readFile`. Renderiza sem biblioteca
externa — converte o YAML/Markdown em componentes React diretamente.

Layout da página:
- Header: "Central das Operadoras" + descrição
- Grid de cards por operadora (7 cards: Amil, Bradesco Saúde, SulAmérica, Hapvida, Maxmed, Previmed, Dental Center)
- Cada card abre um painel lateral (drawer) ou accordion com as seções:
  - Carências padrão (urgência, consultas, demais, parto, CPT)
  - Tipos de plano disponíveis
  - Faixas etárias ANS
  - Observações regionais (João Pessoa/PB)

**Atualização em `prime-academy/page.tsx`:**
- Mudar o card "Central das Operadoras" de `href='#'` / `disponivel: false`
  para `href='/prime-academy/central-operadoras'` / `disponivel: true`
- Badge: "7 operadoras" em vez de "Em breve"

---

## Arquivos modificados / criados

### AGENTE-CRM
| Ação | Arquivo |
|---|---|
| CRIAR | `packages/database/src/queries/crm-queries.ts` |
| EDITAR | `packages/database/src/queries/index.ts` (adicionar export) |
| EDITAR | `apps/worker/src/runners/mpa.runner.ts` (5 tools novas) |
| CRIAR | `scripts/import-operadoras-knowledge.ts` |
| EDITAR | `package.json` (script import-operadoras) |

### crm-seguros
| Ação | Arquivo |
|---|---|
| CRIAR | `src/app/(protected)/prime-academy/central-operadoras/page.tsx` |
| EDITAR | `src/app/(protected)/prime-academy/page.tsx` (ativar card) |

---

## Ordem de execução

1. Item D (crm-queries.ts + mpa.runner.ts) — código puro, sem dependências externas
2. Item E Parte 1 (script import-operadoras) — requer GOOGLE_AI_API_KEY e Supabase credentials
3. Item E Parte 2 (página CRM) — independente, pode rodar junto com Item D

---

## Teste manual após implementação

**Item D:**
- Conectar número da Andreia em Settings → Corretores
- Mandar no WhatsApp: "quais meus compromissos hoje?"
- Mandar: "quantos leads tenho em negociação?"
- Mandar: "quanto vendi esse mês?"
- Mandar: "agenda reunião de vendas quinta-feira às 15h"

**Item E:**
- Abrir `/prime-academy/central-operadoras` e verificar as 7 operadoras
- Mandar no WhatsApp: "qual a carência de parto da Amil?"
- Mandar: "Bradesco cobre coparticipação?"
- Verificar que searchKnowledge retorna resultado das operadoras
