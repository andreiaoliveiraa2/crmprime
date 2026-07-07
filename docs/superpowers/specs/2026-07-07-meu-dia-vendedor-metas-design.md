# Meu Dia do Vendedor + Metas por Operadora — Design

**Data:** 2026-07-07
**Status:** Aprovado (aguardando revisão do documento)

## Objetivo

Dar ao vendedor a **mesma experiência de "Meu Dia" que a admin tem, porém com os dados dele** — em especial "quanto vou receber" e a meta do mês. Abrir o sistema e ver o próprio dinheiro e a própria meta é o que motiva o vendedor a vender.

De quebra, isso corrige um vazamento: hoje o "Meu Dia" usa o mesmo render pra admin e vendedor, e os cards de dinheiro/vendas/meta mostram os totais **da empresa inteira** pra qualquer um que abrir.

## O que muda (resumo)

Quatro cards do dashboard (`/dashboard`, "Meu Dia") passam a respeitar o perfil de quem abre, e ganhamos um recurso de **metas mensais por operadora**, definidas pela admin e visíveis nos dois perfis.

| Card | Admin (você) | Vendedor |
|------|--------------|----------|
| **Vou receber** | Igual a hoje (empresa) | Comissões **dele**: total a receber + este mês + por operadora; clique vai pra `/minhas-comissoes` |
| **Meta do mês** | Meta da empresa, por operadora | Meta **dele**, por operadora |
| **Vendas por operadora** (donut) | Igual a hoje (empresa) | Vendas **dele** |
| **Agenda** | Próximos compromissos (+ Google) | Próximos compromissos dele |

## Fora de escopo (deixado para depois)

- **Lembretes admin→vendedor** no "Urgente" (a Andreia resolve por WhatsApp por enquanto).
- **Calculador V.E.N.D.A. completo** (abordagens, propostas, taxa de conversão, ticket médio, alavanca). A meta aqui é só **por operadora: Meta / Vendido / % / Falta** — sem os termos de funil.
- **Meta semanal e histórico de metas** (existiam no MPA; ficam para uma próxima etapa).
- **Meta por número de vendas** (só valor em R$ por enquanto).

---

## Detalhe dos cards

### 1. Card "Vou receber" (dinheiro)

- **Admin:** mantém o comportamento atual (soma de `vendas` do mês, por operadora). Nenhuma mudança.
- **Vendedor:** puxa da tabela `comissoes` (as comissões dele já são isoladas por RLS — a página `/minhas-comissoes` já faz isso sem filtro explícito):
  - **Número grande:** total a receber = soma de `valor_vendedor` com `status_vendedor = 'Pendente'` (todas as pendentes, sem recorte de mês).
  - **Ao lado:** "este mês" = soma de `valor_vendedor` pendente com `data_prevista` dentro do mês corrente.
  - **Barras por operadora:** as comissões dele agrupadas por operadora (via join `vendas.operadora`).
  - **Link:** `/minhas-comissoes` (hoje aponta pra `/financeiro`, que é bloqueado pro vendedor).

### 2. Card "Meta do mês" (novo formato, nos dois perfis)

Substitui o bloco de funil atual (Abordagens → Propostas → Vendas) por uma visão por operadora.

- **Topo:** Meta (R$) · Vendido (R$) · % atingido · **Falta (R$)** do mês inteiro, e o ritmo necessário (R$/semana).
- **Tabela por operadora:** uma linha por operadora com **Meta | Vendido | % | Falta**, e uma linha **TOTAL**.
- Aparecem as operadoras que têm meta definida **ou** que tiveram venda no mês.

**Fórmulas (por operadora e no total):**
- `Vendido` = soma de `valor_plano` das `vendas` do mês naquela operadora, no escopo (empresa = todas; vendedor = as dele).
- `%` = `Vendido / Meta` (0 se Meta = 0).
- `Falta` = `max(0, Meta − Vendido)`.
- `Ritmo/semana` = `Falta_total / semanas_restantes_no_mês`.

**Escopo do "Vendido":**
- Admin → todas as vendas do mês (empresa).
- Vendedor → só as vendas dele. Como a tabela `vendas` guarda `vendedor` (nome) e **não** `vendedor_id`, o filtro do vendedor é pelo nome do vendedor logado (buscado a partir de `usuario.vendedor_id`). *(A confirmar no plano: se RLS de `vendas` já limita por vendedor, o filtro explícito é redundante mas inofensivo.)*

### 3. Card "Vendas por operadora" (donut)

- **Admin:** igual a hoje.
- **Vendedor:** o donut conta as vendas **dele** no mês (mesmo escopo do "Vendido" acima). Link continua, mas para o vendedor aponta para `/clientes` (não `/financeiro`).

### 4. Card "Agenda" (próximos compromissos)

Hoje mostra só os compromissos **de hoje** e fica "Agenda livre hoje" quando não há nada. Passa a mostrar os **próximos** compromissos pra nunca ficar vazio.

- Nova consulta "próximos": `agenda` com `data_hora >= início do dia de hoje`, ordenado crescente, limite ~4. Escopo por `vendedor_id` para o vendedor (como as outras consultas já fazem).
- Cada linha: **dia/hora + título**. Marca com "· Google" quando vier do Google (só admin).
- Admin: mescla os próximos eventos do Google (janela futura, ex. próximos 7 dias, limitado).
- Vazio de verdade → "Nenhum compromisso agendado".

---

## Recurso: Metas mensais por operadora

### Modelo de dados — tabela `metas`

| Coluna | Tipo | Nota |
|--------|------|------|
| `id` | uuid PK | |
| `vendedor_id` | uuid, nullable | `null` = meta da **empresa** (dashboard da admin) |
| `mes_referencia` | date | 1º dia do mês (ex.: `2026-07-01`) |
| `operadora` | text | nome da operadora (casa com `operadoras.nome`) |
| `meta_valor` | numeric | valor da meta em R$ |
| `criado_em` | timestamptz default now() | |
| `atualizado_em` | timestamptz | |

- **Unicidade:** uma meta por (escopo, mês, operadora). Como `vendedor_id` nulo (empresa) não é coberto por unique comum no Postgres, usar duas índices únicos parciais: um `where vendedor_id is not null` sobre `(vendedor_id, mes_referencia, operadora)` e um `where vendedor_id is null` sobre `(mes_referencia, operadora)`.
- **Mensal:** cada mês tem suas próprias linhas. A admin redefine a cada mês (não há carregamento automático do mês anterior nesta versão).

### RLS

- **Admin:** leitura e escrita de todas as linhas.
- **Vendedor:** leitura **somente** das linhas com `vendedor_id = seu vendedor_id`. Sem escrita. Não enxerga metas da empresa nem de outros vendedores.

### UI de configuração (admin)

Na tela de **Gestão**:
- **Meta da empresa:** uma seção com as operadoras ativas e um campo **Meta (R$)** em cada, para o mês selecionado. (`vendedor_id = null`.)
- **Meta por vendedor:** ao abrir/gerenciar um vendedor, a mesma tabelinha (operadoras × Meta R$) para aquele vendedor e mês.
- Seletor de mês (default: mês atual). Salvar faz upsert nas linhas de `metas`.
- Lista de operadoras vem da tabela `operadoras` (`nome`), como no resto do sistema.

---

## Abordagem de implementação

- **Uma única página de dashboard.** Os quatro cards passam a ser condicionais ao `usuario.perfil`. Nada do dashboard da admin muda de aparência, exceto o card "Meta do mês" (que ganha o formato por operadora — desejado nos dois).
- Carregar no server component do dashboard: as `metas` do mês (escopo conforme perfil) e, para o vendedor, as `comissoes` dele. Filtrar `vendas` por vendedor quando for vendedor.
- Extrair a lógica de "meta por operadora" (juntar metas + vendido, calcular %/falta/total) numa função pura reutilizável, já que roda nos dois perfis.
- O card "Meta do mês" e o editor de metas são componentes focados e testáveis isoladamente.

## Passos sugeridos (formiguinha)

1. **Escopo do dinheiro/vendas do vendedor** — "Vou receber" (comissões dele) + donut "Vendas por operadora" dele. *(Rápido; já resolve o vazamento e o "quanto vou receber".)*
2. **Tabela `metas` + RLS** (migração).
3. **UI de definição de metas** na Gestão (empresa + por vendedor).
4. **Card "Meta do mês" por operadora** nos dois perfis (lendo `metas` + vendas reais).
5. **Card "Agenda" → próximos compromissos.**
6. **Build + revisão** e aviso para Deploy no cursoia.

## Testes / verificação

- Logar como vendedor: "Vou receber" mostra o total dele (bate com `/minhas-comissoes`), donut só com vendas dele, "Meta do mês" com a meta dele, e nenhum número da empresa aparece.
- Logar como admin: cards da empresa iguais aos de hoje, exceto "Meta do mês" no novo formato por operadora.
- Definir meta na Gestão e ver refletir no card na hora.
- Vendedor não consegue ler metas de outro vendedor nem da empresa (checar via RLS).
- Card Agenda nunca fica vazio quando há compromissos futuros.
