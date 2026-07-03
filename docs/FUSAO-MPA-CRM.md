# Fusão MPA + CRM — Escopo

## Visão geral

O CRM (crm-seguros) era um sistema estático: o corretor fazia tudo na mão.
O MPA (Desktop/MPA) é o cérebro: agentes de IA que automatizam o trabalho.

Esta fusão coloca o MPA DENTRO do CRM. O corretor passa a ter:
- **WhatsApp (MPA)** — fala com os agentes, que preenchem o CRM automaticamente
- **CRM (manual)** — opera tudo na mão quando quiser, com liberdade total

As duas formas funcionam juntas. O WhatsApp é facilitador, não bloqueio.
Tudo usa Groq (grátis) — NUNCA Anthropic/OpenAI pago.

## Regra de ouro
- Não remover nenhuma funcionalidade existente do CRM
- Só ACRESCENTAR
- Identidade visual sempre do CRM (roxo #2d1f4e / #5b3fb5 + dourado #b89a6a)
- LLM sempre Groq (llama-3.3-70b-versatile)

---

## O que JÁ FOI FEITO (não refazer)

### 1. Dashboard "Meu Dia"
Arquivo: `src/app/(protected)/dashboard/page.tsx`
- Substituiu o dashboard antigo
- 12 cards com dados reais do Supabase (leads, clientes, agenda, vendas)
- Cards: Resolva primeiro, Vou receber, Agenda, Carteira, Pendências,
  Meta do mês (com funil), Leads recentes, Vendas por operadora,
  Posts de hoje, Stories de hoje, Semana de conteúdo
- Todos clicáveis, levam pra página correspondente do CRM

### 2. Splash Screen
Arquivo: `src/components/SplashScreen.tsx`
- Tela roxa com logo, versículo do dia (20 versículos rotativos)
- Botão "Abrir meu dia →"
- Aparece 1x por sessão (sessionStorage)

### 3. Menu lateral atualizado
Arquivo: `src/components/Sidebar.tsx`
- "Dashboard" renomeado pra "Meu Dia"
- "MPA" (chat) REMOVIDO do menu
- "Agentes" ADICIONADO (novo)
- Resto do menu intacto (CRM, Clientes, Agenda, Financeiro, Gestão,
  Marketing, Prime Academy, Cotador, WhatsApp IA, Configurações)

### 4. Página "Agentes"
Arquivo: `src/app/(protected)/agentes/page.tsx`
- Lista os 7 agentes com status, última ação, próxima execução
- Por enquanto dados estáticos (placeholder) — precisa conectar dados reais depois

### 5. Botão flutuante de chat
Arquivo: `src/components/MpaChatButton.tsx`
- Bolinha roxa no canto inferior direito
- Mini-chat pra digitar comando sem ir pro WhatsApp
- Adicionado no layout: `src/app/(protected)/layout.tsx`

### 6. Chat API trocado pra Groq
Arquivo: `src/app/api/chat/route.ts`
- Removido Anthropic, agora usa Groq (grátis)
- Precisa GROQ_API_KEY no .env.local

---

## O que FALTA FAZER

### A. Configurar a chave Groq
- Adicionar `GROQ_API_KEY` no `.env.local` do crm-seguros
- Usar a mesma chave do agente WhatsApp (AGENTE-CRM)

### B. Página "Conteúdo" (nova)
- Onde o agente de conteúdo salva posts/stories/calendário editorial
- Antes ficava em planilha Google/Notion — agora no CRM
- Criar tabela no Supabase: `conteudos` (tipo, titulo, legenda, data, status, perfil)
- Página pra ver/editar/criar conteúdo manualmente também

### C. Conectar página "Agentes" com dados reais
- Mostrar status real de cada agente (última execução, o que fez)
- Tabela no Supabase: `agente_execucoes` (agente, status, ultima_acao, executado_em)

### D. Ferramentas do MPA no WhatsApp (AGENTE-CRM)
No `AGENTE-CRM/apps/worker/src/runners/mpa.runner.ts`, adicionar:
- `getAgenda` → "quais meus compromissos hoje?"
- `getSalesMetrics` → "quanto vendi esse mês?"
- `createAppointment` → "agenda reunião quinta 15h"
- `getLeads`, `createLead` → consultar/criar lead
- `getComissoes` → consultar comissões
Tudo lendo/escrevendo nas tabelas existentes do CRM (Supabase compartilhado)

### E. Central das Operadoras (Prime Academy)
- Já tem placeholder "Em breve" em `src/app/(protected)/prime-academy/page.tsx`
- Criar a página com regras, carências, documentos das operadoras
- Agente usa como knowledge base pra responder no WhatsApp

### F. Cron jobs (automação)
- Agentes rodando de madrugada preenchendo o CRM:
  - Carteira: verifica planos vencendo (6h)
  - Comercial: identifica leads sem retorno (7h)
  - Conteúdo: planeja posts do dia (6h)
  - Financeiro: calcula comissões (dia 1 do mês)
  - Espião: monitora perfis e temas em alta (8h)

---

## Arquitetura técnica

### Banco de dados (Supabase — projeto lctacientnedmarsbitt)
- Tabelas CRM existentes: leads, clientes, agenda, vendas, operadoras, etc.
- Tabelas WhatsApp (wa_*): wa_agents, wa_conversations, wa_messages,
  wa_knowledge_documents, wa_organization_members, etc.
- Organização ID: 936b0370-b463-4419-b2ec-c9d8d2296322

### Infraestrutura
- VPS: 2.24.99.186 → /srv/agente-crm/
- Evolution API: https://evolution-evolution-api.wftljx.easypanel.host
- Webhook: https://api.a2primecorretora.com/webhooks/evolution
- LLM: Groq llama-3.3-70b-versatile (grátis)
- Embeddings: Google text-embedding-004 (grátis)

### Custo total: R$ 0 além da VPS (que já era paga)

---

## Sistema genérico (multi-tenant)
Nenhum nome de empresa fixo no código. Tudo vem do system_prompt do
agente cadastrado por organização. Andreia vai trocar "A2 Prime" por
outro nome quando for vender pra outras corretoras.

### Modelo de negócio (escada de planos)
- Básico R$57/mês: Agente MPA no WhatsApp
- Profissional R$97/mês: + Central do Corretor (knowledge base, comissões)
- Premium R$197/mês: + CRM + Marketing + WhatsApp integrado
- Preço por usuário extra em cada plano
