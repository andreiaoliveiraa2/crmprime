# CRM Evolução — Especificação de Design

**Data:** 2026-05-16
**Projeto:** crm-seguros
**Contexto:** Evolução do CRM existente para sistema completo de gestão de leads e clientes para corretora de seguros e planos de saúde.

---

## 1. Visão Geral

Evolução do sistema atual para um CRM profissional com separação clara entre **pré-venda** (leads em pipeline) e **pós-venda** (clientes fechados), dashboard com métricas reais de negócio, Kanban completo e visual premium estilo SaaS.

**Princípio central:** Lead ≠ Cliente. Um lead vira cliente quando fecha negócio no pipeline.

---

## 2. Banco de Dados

### Tabela `leads` (renomeada e expandida da atual `clientes`)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Gerado automaticamente |
| nome | TEXT | Sim | Nome do lead |
| telefone | TEXT | Não | Telefone / WhatsApp |
| tipo_plano | TEXT | Não | Ex: Saúde, Odonto, Vida, Auto |
| etapa | TEXT | Sim | Ver etapas abaixo |
| criado_em | TIMESTAMPTZ | Sim | Automático |

**Etapas do pipeline (em ordem):**
1. Novo Lead
2. Contato Feito
3. Proposta Enviada
4. Negociação
5. Fechado
6. Perdido

### Tabela `clientes` (nova — pós-venda)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Gerado automaticamente |
| nome | TEXT | Sim | Nome completo |
| contato | TEXT | Não | Telefone principal |
| email | TEXT | Não | E-mail |
| tipo_plano | TEXT | Não | Plano contratado |
| valor_plano | NUMERIC | Sim | Valor mensal R$ |
| observacoes | TEXT | Não | Anotações livres |
| lead_id | UUID | Não | FK para leads (origem) |
| criado_em | TIMESTAMPTZ | Sim | Data de entrada como cliente |

### Migração dos dados existentes
Os dados atuais da tabela `clientes` serão migrados para a tabela `leads`, pois eram leads em pipeline. A tabela `clientes` atual será renomeada para `leads` com os novos campos adicionados.

### RLS
Ambas as tabelas com Row Level Security — acesso apenas para `authenticated` com `auth.uid() IS NOT NULL`.

---

## 3. Navegação — Menu Lateral

5 itens fixos:
1. **Dashboard** — `/dashboard`
2. **CRM** — `/crm` (lista de leads)
3. **Pipeline** — `/pipeline` (Kanban)
4. **Clientes** — `/clientes` (pós-venda)
5. **Configurações** — `/configuracoes`

---

## 4. Telas

### 4.1 Dashboard

**4 cards no topo:**
- **Total de Clientes** — contagem da tabela `clientes` — cor violeta
- **Leads Ativos** — leads com etapa ≠ Fechado e ≠ Perdido — cor azul
- **Vendas em Andamento** — leads em Proposta Enviada + Negociação — cor âmbar
- **Ganhos no Mês** — soma de `valor_plano` dos clientes com `criado_em` no mês atual — cor verde

**Seção inferior:**
- Lista de leads recentes (últimos 5 adicionados)
- Lista de clientes recentes (últimos 5 fechados)

### 4.2 CRM — Lista de Leads

- Busca por nome ou telefone
- Filtro por etapa (pills)
- Tabela: Nome | Telefone | Tipo de Plano | Etapa | Data | Ações
- Botão "Novo Lead" (primário, roxo)
- Ações por linha: Editar, Excluir, Mover para Pipeline

### 4.3 Pipeline — Kanban

6 colunas (esquerda → direita):
`Novo Lead` | `Contato Feito` | `Proposta Enviada` | `Negociação` | `Fechado` | `Perdido`

- Cards com: nome, telefone, tipo de plano
- Drag & drop entre colunas
- Ao mover para **Fechado** → abre **Modal de Conversão**
- Ao mover para **Perdido** → confirmação simples

**Modal de Conversão (Lead → Cliente):**
- Título: "Converter para Cliente"
- Campos pré-preenchidos: Nome, Tipo de Plano
- Campos a preencher: E-mail, Telefone, Valor do Plano (obrigatório), Observações
- Ações: "Cancelar" (lead volta para Negociação) | "Salvar como Cliente"

### 4.4 Clientes — Lista Pós-Venda

- Tabela: Nome | Email | Telefone | Tipo de Plano | Valor | Data de Entrada | Ações
- Botão "Novo Cliente" (cadastro manual, sem pipeline)
- Clique na linha → ficha completa para editar todos os campos
- Ações: Editar, Excluir

### 4.5 Configurações

- Dados da conta: nome de exibição, email (leitura)
- Botão "Sair" (logout)

---

## 5. Visual

### Paleta de Cores
- **Sidebar:** fundo `stone-100` (bege claro), texto `stone-800` (marrom escuro)
- **Fundo geral:** `white` / `gray-50`
- **Destaque principal:** `violet-600` (roxo suave) — botões, links ativos
- **Cards pastel:**
  - Violeta: `violet-50` / `violet-700`
  - Azul: `blue-50` / `blue-700`
  - Âmbar: `amber-50` / `amber-700`
  - Verde: `emerald-50` / `emerald-700`

### Tipografia
- Fonte: Geist Sans (já instalada)
- Títulos de página: `text-2xl font-bold text-stone-800`
- Subtítulos/labels: `text-sm text-stone-500`
- Corpo: `text-stone-700`

### Componentes
- **Sidebar fixa** — largura 256px, fundo `stone-100`, bordas `stone-200`
- **Cards** — bordas `stone-200`, fundo branco, sombra `shadow-sm`, hover `shadow-md`
- **Tabelas** — hover `stone-50`, bordas `stone-100`, sem excesso de linhas
- **Botão primário** — `violet-600`, hover `violet-700`, texto branco
- **Botão secundário** — `stone-100`, hover `stone-200`, texto `stone-700`
- **Kanban** — colunas com fundo pastel por etapa, cards brancos com sombra leve
- **Animações** — transições `duration-200`, hover com elevação discreta (`shadow-md`)
- **Espaçamento generoso** — padding `p-6 md:p-8`, gaps amplos entre seções

---

## 6. Componentes a Criar / Modificar

### Novos componentes
- `Sidebar.tsx` — redesenhada com 5 itens e nova identidade visual
- `DashboardCard.tsx` — card com ícone, valor e cor
- `LeadTable.tsx` — tabela de leads com busca e filtro
- `LeadForm.tsx` — formulário de lead (novo/editar)
- `KanbanBoard.tsx` — Kanban atualizado com novas etapas
- `ConversaoModal.tsx` — modal de conversão lead → cliente
- `ClienteTable.tsx` — tabela de clientes pós-venda
- `ClienteForm.tsx` — formulário de cliente (novo/editar)
- `ClienteDetail.tsx` — ficha completa do cliente

### Páginas novas/modificadas
- `app/(protected)/dashboard/page.tsx` — dashboard renovado
- `app/(protected)/crm/page.tsx` — lista de leads
- `app/(protected)/pipeline/page.tsx` — Kanban
- `app/(protected)/clientes/page.tsx` — lista de clientes
- `app/(protected)/clientes/novo/page.tsx` — novo cliente
- `app/(protected)/clientes/[id]/page.tsx` — editar cliente
- `app/(protected)/configuracoes/page.tsx` — configurações

---

## 7. Comportamentos

### Busca no CRM
- Busca em tempo real (client-side) por nome ou telefone
- Sem chamada ao servidor a cada digitação

### Filtro por etapa
- Pills clicáveis — "Todos" ativo por padrão
- Combina com a busca

### Drag & Drop no Pipeline
- Otimismo de UI: move card imediatamente, reverte em caso de erro
- Ao soltar em "Fechado": abre modal de conversão
- Ao soltar em "Perdido": confirmação "Marcar como perdido?"

### Ganhos no Mês
- Calculado em tempo real: `SELECT SUM(valor_plano) FROM clientes WHERE criado_em >= início do mês atual`
- Exibido como "R$ 0,00" se não houver clientes no mês

### Migração de dados
- Dados da tabela `clientes` atual migram para `leads`
- Etapas antigas mapeadas para as novas:
  - Lead → Novo Lead
  - Contato → Contato Feito
  - Proposta → Proposta Enviada
  - Fechado → Fechado
  - Perdido → Perdido
