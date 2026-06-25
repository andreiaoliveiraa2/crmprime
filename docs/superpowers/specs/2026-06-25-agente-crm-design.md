# Agente CRM — WhatsApp AI Agent Design Spec

**Data:** 2026-06-25
**Projeto:** agente-crm (novo) + crm-seguros (existente, recebe novas páginas)
**Contexto:** Integração de agente de IA via WhatsApp ao CRM existente. Sistema com modo dual: corretores enviam comandos MPA pelo WhatsApp e clientes/leads recebem atendimento automático. Mesmo número de WhatsApp para os dois fluxos.

---

## 1. Decisões de Arquitetura

| Aspecto | Decisão |
|---------|---------|
| Caso de uso | Modo dual: comandos MPA (corretores) + atendimento ao cliente |
| Arquitetura | Monorepo Turborepo em `Desktop/agente-crm/` |
| Backend | Fastify + TypeScript (`apps/api`) |
| Worker | BullMQ processo separado (`apps/worker`) |
| Dashboard | Novas páginas no `crm-seguros` existente (não cria app novo) |
| LLM | Vercel AI SDK com Gemini 1.5 Flash como padrão (gratuito) |
| Agente | Function calling com tools (RAG + FAQs + acesso ao Supabase CRM) |
| Knowledge base | MPA markdown (46 agentes) + docs da corretora via pgvector |
| Banco | Supabase existente do crm-seguros (PostgreSQL + pgvector + RLS) |
| Cache/Filas | Redis + BullMQ (Railway Redis nativo) |
| Multi-tenancy | Organização única (corretora) mapeada ao auth existente |
| Inbox | Completo: takeover, notas, filtros, realtime |
| Evolution API | Instância única gerenciada pelo dashboard |
| Deploy | Railway (agente-crm) + Vercel/servidor existente (crm-seguros) |

---

## 2. Estrutura do Projeto

### Novo projeto: `Desktop/agente-crm/`

```
agente-crm/
├── apps/
│   ├── api/                    # Fastify — webhooks, REST endpoints
│   │   └── src/
│   │       ├── server.ts
│   │       ├── routes/
│   │       │   ├── webhooks/evolution.ts
│   │       │   ├── messages/send.ts
│   │       │   ├── instances/index.ts
│   │       │   ├── agents/index.ts
│   │       │   └── knowledge/
│   │       │       ├── documents.ts
│   │       │       └── faqs.ts
│   │       ├── services/
│   │       │   ├── evolution.service.ts
│   │       │   ├── conversation.service.ts
│   │       │   ├── message.service.ts
│   │       │   └── knowledge.service.ts
│   │       └── lib/
│   │           ├── supabase.ts
│   │           ├── redis.ts
│   │           └── queue.ts
│   └── worker/                 # BullMQ — processa mensagens e documentos
│       └── src/
│           ├── index.ts
│           ├── workers/
│           │   ├── process-message.ts
│           │   ├── send-message.ts
│           │   ├── process-document.ts
│           │   └── takeover-timeout.ts
│           ├── agents/
│           │   ├── router.ts             # Roteador dual-mode
│           │   ├── mpa-runner.ts         # Modo MPA
│           │   ├── attendance-runner.ts  # Modo atendimento
│           │   └── tools/
│           │       ├── search-knowledge.ts
│           │       ├── search-faq.ts
│           │       ├── get-leads.ts      # Acesso ao CRM
│           │       ├── create-lead.ts    # Cria lead no CRM
│           │       └── registry.ts
│           └── embeddings/
│               ├── chunker.ts
│               └── embedder.ts
├── packages/
│   ├── shared/                 # Tipos, constantes, schemas Zod
│   ├── database/               # Supabase client + queries
│   └── queue/                  # Definições BullMQ
├── docker-compose.yml          # Dev local: Redis + API + Worker
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Projeto existente: `crm-seguros/` (recebe adições)

```
crm-seguros/src/
├── app/(protected)/
│   ├── whatsapp/               # NOVO — área WhatsApp no CRM
│   │   ├── layout.tsx
│   │   ├── inbox/
│   │   │   ├── page.tsx        # Lista de conversas
│   │   │   └── [id]/page.tsx   # Chat da conversa
│   │   ├── agentes/
│   │   │   ├── page.tsx        # Lista de agentes
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Config do agente
│   │   │       └── knowledge/page.tsx  # Knowledge base do agente
│   │   ├── instancias/
│   │   │   └── page.tsx        # Gestão Evolution API + QR code
│   │   └── configuracoes/
│   │       └── page.tsx        # API keys, config global
├── components/
│   ├── WhatsappInbox.tsx       # NOVO
│   ├── WhatsappChat.tsx        # NOVO
│   ├── AgentConfig.tsx         # NOVO
│   └── EvolutionQRCode.tsx     # NOVO
└── app/api/
    └── whatsapp/               # NOVO — BFF routes para o agente-crm API
        ├── send/route.ts
        ├── takeover/route.ts
        └── knowledge/route.ts
```

---

## 3. Modo Dual — Roteamento

### Regra de roteamento (no worker)

O roteamento é baseado **exclusivamente no número do remetente** — sem prefixo, sem convenção de texto. O corretor escreve naturalmente, como faria com um assistente humano.

```typescript
function routeMessage(senderPhone: string, registeredCorretores: string[]): 'mpa' | 'attendance' {
  if (registeredCorretores.includes(senderPhone)) return 'mpa';
  return 'attendance';
}
```

`registeredCorretores` = lista de `whatsapp_phone` da tabela `wa_organization_members`, carregada em cache no worker.

### Modo MPA

- **Trigger**: número do remetente está cadastrado em `wa_organization_members.whatsapp_phone`
- O corretor escreve qualquer coisa: `"bom dia"`, `"cria um lead"`, `"me ajuda com follow-up"`, `"preciso de uma postagem"` — tudo vai para o MPA
- Sistema identifica o corretor pelo número → carrega seus dados do CRM (leads, clientes, comissões) como contexto
- Gemini recebe: system prompt do MPA + dados do CRM + knowledge base dos 46 agentes
- Resposta vai de volta ao WhatsApp do corretor

### Modo Atendimento

- **Trigger**: número do remetente **não** está cadastrado como corretor
- Sistema ativa o agente de atendimento (`mode = 'client_attendance'`)
- Gemini qualifica o lead com perguntas padrão
- Ao qualificar: cria registro na tabela `leads` do CRM existente
- Handoff: corretor assume pelo inbox no dashboard

### Mapeamento corretor ↔ WhatsApp

O campo `whatsapp_phone` da tabela `wa_organization_members` (seção 4.2) armazena o número do corretor. O worker consulta essa tabela para determinar se o remetente é um corretor cadastrado e qual `user_id` corresponde a ele.

---

## 4. Schema do Banco de Dados

As novas tabelas são criadas no Supabase existente do `crm-seguros`. Elas coexistem com as tabelas já existentes (`leads`, `clientes`, `vendas`, etc.).

### 4.1 Extensões necessárias

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

### 4.2 Organização (simplificada — corretora única)

```sql
-- Uma única organização representa a corretora
CREATE TABLE wa_organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mapeamento usuários → organização (usa auth.users existente)
CREATE TABLE wa_organization_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'agent')) DEFAULT 'agent',
  whatsapp_phone text UNIQUE,   -- número WhatsApp deste corretor
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
```

### 4.3 Agentes

```sql
CREATE TABLE wa_agents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  system_prompt text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('mpa', 'client_attendance')),
  model text NOT NULL DEFAULT 'gemini-1.5-flash',
  provider text NOT NULL DEFAULT 'google' CHECK (provider IN ('openai', 'anthropic', 'google')),
  temperature real NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens integer NOT NULL DEFAULT 1024,
  tools_config jsonb NOT NULL DEFAULT '{"search_knowledge": true, "search_faq": true, "crm_access": false}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- tools_config para modo mpa inclui: {"search_knowledge": true, "crm_access": true, "create_lead": false}
-- tools_config para modo client_attendance: {"search_knowledge": true, "search_faq": true, "create_lead": true}
```

### 4.4 Evolution API

```sql
CREATE TABLE wa_evolution_instances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  instance_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting')),
  phone_number text,
  webhook_url text,
  active_agent_id uuid REFERENCES wa_agents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- QR code é efêmero — buscado em tempo real da Evolution API, nunca armazenado
```

### 4.5 Contatos

```sql
CREATE TABLE wa_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  phone text NOT NULL,
  name text,
  photo_url text,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,  -- FK para tabela leads existente
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, phone)
);
```

### 4.6 Conversas e Mensagens

```sql
CREATE TABLE wa_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES wa_agents(id) ON DELETE CASCADE,
  evolution_instance_id uuid NOT NULL REFERENCES wa_evolution_instances(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES wa_contacts(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('mpa', 'client_attendance')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'resolved', 'closed')),
  is_human_takeover boolean NOT NULL DEFAULT false,
  human_takeover_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wa_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES wa_conversations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  evolution_message_id text,
  role text NOT NULL CHECK (role IN ('contact', 'agent', 'human_agent', 'system')),
  content text NOT NULL DEFAULT '',
  media_url text,
  media_type text CHECK (media_type IN ('text', 'image', 'audio', 'video', 'document', 'sticker', 'location')),
  metadata jsonb,   -- {model, tokens_used, latency_ms, tool_calls}
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wa_conversation_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES wa_conversations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 4.7 Knowledge Base (RAG)

```sql
CREATE TABLE wa_knowledge_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid NOT NULL REFERENCES wa_agents(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'txt', 'md', 'docx', 'csv')),
  file_size_bytes integer NOT NULL,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  error_message text,
  chunk_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wa_knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES wa_knowledge_documents(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(768),    -- 768 dimensões para Gemini text-embedding-004
  chunk_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wa_knowledge_faqs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid NOT NULL REFERENCES wa_agents(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 4.8 API Keys dos Providers

```sql
CREATE TABLE wa_provider_secrets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google')),
  encrypted_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider)
);
```

### 4.9 Índices

```sql
-- Conversas
CREATE INDEX idx_wa_conversations_org_last ON wa_conversations(organization_id, last_message_at DESC);
CREATE INDEX idx_wa_conversations_org_status ON wa_conversations(organization_id, status);
CREATE INDEX idx_wa_conversations_contact ON wa_conversations(contact_id);

-- Mensagens
CREATE INDEX idx_wa_messages_conversation ON wa_messages(conversation_id, created_at);
CREATE UNIQUE INDEX idx_wa_messages_evolution_id ON wa_messages(evolution_message_id)
  WHERE evolution_message_id IS NOT NULL;

-- Contatos
CREATE UNIQUE INDEX idx_wa_contacts_org_phone ON wa_contacts(organization_id, phone);

-- Knowledge
CREATE INDEX idx_wa_knowledge_docs_agent ON wa_knowledge_documents(agent_id);
CREATE INDEX idx_wa_knowledge_chunks_doc ON wa_knowledge_chunks(document_id);
CREATE INDEX idx_wa_knowledge_chunks_org ON wa_knowledge_chunks(organization_id);
CREATE INDEX idx_wa_knowledge_chunks_embedding ON wa_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Agentes
CREATE INDEX idx_wa_agents_org ON wa_agents(organization_id);
CREATE INDEX idx_wa_evolution_instances_org ON wa_evolution_instances(organization_id);
```

### 4.10 RLS

```sql
ALTER TABLE wa_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_evolution_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_conversation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_knowledge_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_provider_secrets ENABLE ROW LEVEL SECURITY;

-- Helper: IDs das orgs do usuário atual
CREATE OR REPLACE FUNCTION wa_get_user_org_ids()
RETURNS SETOF uuid AS $$
  SELECT organization_id FROM wa_organization_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS genérica para tabelas com organization_id
-- (policies de SELECT/INSERT/UPDATE/DELETE por organização)
-- O worker usa service_role key — bypassa RLS por design
```

### 4.11 Função de busca vetorial

```sql
CREATE OR REPLACE FUNCTION wa_search_knowledge(
  query_embedding vector(768),
  match_count int DEFAULT 5,
  filter_organization_id uuid DEFAULT NULL,
  filter_agent_id uuid DEFAULT NULL
)
RETURNS TABLE (id uuid, content text, metadata jsonb, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM wa_knowledge_chunks kc
  JOIN wa_knowledge_documents kd ON kd.id = kc.document_id
  WHERE
    (filter_organization_id IS NULL OR kc.organization_id = filter_organization_id)
    AND (filter_agent_id IS NULL OR kd.agent_id = filter_agent_id)
    AND kd.status = 'ready'
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 5. Backend — API Server (`apps/api`)

### Responsabilidades

- Receber webhooks da Evolution API e enfileirar processamento
- Endpoints REST para o dashboard do `crm-seguros` (envio manual, gestão de instâncias, upload de docs)
- Autenticação via JWT Supabase (mesmo auth do CRM)
- **Não processa LLM** — apenas enfileira no BullMQ

### Fluxo do Webhook

1. Evolution API dispara `POST /webhooks/evolution`
2. Validar assinatura/origin
3. Extrair: `instanceId`, `phone`, `message`, `messageType`, `evolutionMessageId`
4. **Idempotência**: checar `evolution_message_id` em `wa_messages` → se existe, retornar 200 OK
5. Buscar `wa_evolution_instances` pelo `instanceId` → obter `organization_id` + `active_agent_id`
6. Upsert contato em `wa_contacts`
7. Resolver modo: consultar `wa_organization_members.whatsapp_phone` → determinar `'mpa'` ou `'client_attendance'`
8. Upsert conversa aberta
9. Salvar mensagem (`role: 'contact'`)
10. Checar `is_human_takeover` → se sim, parar aqui
11. Enfileirar job `process-message` com `{ conversationId, messageId, agentId, mode }`

### Endpoints do Dashboard (BFF)

| Método | Rota | Ação |
|--------|------|------|
| POST | `/messages/send` | Enviar mensagem manual (humano) |
| GET | `/instances` | Listar instâncias Evolution |
| POST | `/instances` | Criar instância |
| GET | `/instances/:id/qrcode` | Buscar QR code em tempo real |
| DELETE | `/instances/:id` | Remover instância |
| GET | `/agents` | Listar agentes |
| POST | `/agents` | Criar agente |
| PATCH | `/agents/:id` | Atualizar agente |
| DELETE | `/agents/:id` | Remover agente |
| POST | `/knowledge/documents` | Upload documento (multipart) |
| DELETE | `/knowledge/documents/:id` | Remover documento |
| GET | `/knowledge/faqs` | Listar FAQs |
| POST | `/knowledge/faqs` | Criar FAQ |
| PATCH | `/knowledge/faqs/:id` | Atualizar FAQ |
| DELETE | `/knowledge/faqs/:id` | Remover FAQ |

---

## 6. Worker BullMQ (`apps/worker`)

### Filas

| Fila | Trigger | Ação |
|------|---------|------|
| `process-message` | Webhook recebe mensagem | Roteia modo, carrega contexto, chama Gemini, salva, enfileira envio |
| `send-message` | LLM responde ou humano envia | Chama Evolution API para enviar |
| `process-document` | Upload via API | Chunking → embedding → pgvector |
| `takeover-timeout` | Cron a cada 5min | Verifica takeovers sem atividade há +30min, alerta |

### Fluxo `process-message`

1. Adquirir Redis lock por `conversation_id` (processamento sequencial por conversa)
2. Ler dados da conversa + agente + modo
3. Resolver API key: `wa_provider_secrets` → fallback para env var `GOOGLE_AI_API_KEY`
4. **Roteador dual-mode**: direcionar para `mpa-runner` ou `attendance-runner`
5. Carregar histórico recente (20 mensagens)
6. Montar system prompt + tools habilitadas
7. Chamar Vercel AI SDK com tool calling loop
8. Salvar resposta em `wa_messages` (`role: 'agent'`, `metadata: {model, tokens, latency}`)
9. Enfileirar `send-message`
10. Atualizar `wa_conversations.last_message_at`
11. Liberar lock

### MPA Runner

- System prompt = instruções do agente MPA da knowledge base (documento markdown do agente selecionado)
- Seleção do agente MPA: keyword matching da mensagem (tabela do CLAUDE.md do MPA) + se ambíguo, chamada Gemini de roteamento
- Tools disponíveis: `search_knowledge`, `get_leads`, `get_clientes`, `get_comissoes`, `get_agenda`
- Tools de escrita (apenas se explicitamente configurado): `create_lead`, `update_lead`
- Dados do CRM acessados via service_role do Supabase (isolados por `user_id` do corretor)

### Attendance Runner

- System prompt = prompt do agente `client_attendance` configurado no dashboard
- Tools: `search_knowledge` (docs da corretora), `search_faq`, `create_lead` (cria em `leads` do CRM)
- Ao criar lead: salva em `leads` existente + atualiza `wa_contacts.lead_id`
- Handoff: se detectar que cliente quer falar com humano, seta `is_human_takeover = true`

### Resiliência

- Lock Redis com TTL de 5min (previne deadlock)
- 3 tentativas com backoff exponencial
- Dead letter queue para falhas persistentes
- Concurrency: `process-message` = 10, `send-message` = 20, `process-document` = 3

---

## 7. Dashboard — Novas Páginas no `crm-seguros`

### Sidebar

Adicionar novo grupo "WhatsApp" na `Sidebar.tsx` existente:

```
WhatsApp
├── Inbox
├── Agentes
├── Instâncias
└── Configurações
```

### Páginas

| Página | Rota | Funcionalidade |
|--------|------|---------------|
| Inbox | `/whatsapp/inbox` | Lista conversas com filtros (status, modo). Chat realtime via Supabase Realtime. Painel lateral: contato, notas, tags. Botão "Assumir"/"Devolver ao agente". |
| Chat | `/whatsapp/inbox/[id]` | Mensagens em tempo real. Campo de resposta para humano. Notas internas. Info do contato. Link para ficha do lead no CRM se houver. |
| Agentes | `/whatsapp/agentes` | Lista de agentes (modo MPA e atendimento). CRUD. Config: nome, prompt, modelo, tools. |
| Knowledge base | `/whatsapp/agentes/[id]/knowledge` | Upload de docs (PDF, TXT, MD). Lista com status (processing/ready/error). FAQs manuais. Barra de progresso de processamento. |
| Instâncias | `/whatsapp/instancias` | Lista de instâncias Evolution. Conectar via QR code (buscado em tempo real). Status, telefone. Vincular agente. |
| Configurações | `/whatsapp/configuracoes` | API keys dos providers LLM. Mapeamento corretor → número WhatsApp. |

### Realtime (Supabase)

```typescript
// Novas mensagens no chat
supabase
  .channel('wa_messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wa_messages' }, handler)
  .subscribe()

// Status das conversas na lista
supabase
  .channel('wa_conversations')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_conversations' }, handler)
  .subscribe()
```

### Comunicação Dashboard → API

O `crm-seguros` usa as tabelas diretamente via Supabase SDK para leituras (RLS protege). Para ações que passam pela Evolution API (envio de mensagens, gestão de instâncias, upload de docs), usa API routes Next.js como BFF apontando para o `agente-crm` API.

---

## 8. Knowledge Base — Importação do MPA

Os 46 agentes do MPA (arquivos markdown em `Desktop/MPA/.claude/`) são importados como documentos na knowledge base do agente MPA.

### Processo de importação

1. No dashboard, admin acessa `/whatsapp/agentes/[mpa-agent-id]/knowledge`
2. Faz upload dos arquivos `.md` individualmente (ou via script de seed)
3. Worker processa: chunking por seção do markdown → embedding Gemini → pgvector
4. Agente MPA usa RAG para buscar as instruções relevantes ao comando recebido

### Script de seed (para importação inicial)

```typescript
// seed-mpa-knowledge.ts — roda uma vez
// Lê todos os .md de Desktop/MPA/.claude/agents/
// Faz POST para /knowledge/documents para cada um
// Associa ao agente MPA da organização
```

---

## 9. Tipos de Mídia no WhatsApp

| Tipo | Tratamento |
|------|-----------|
| text | Processado diretamente pelo LLM |
| image | Salvo como `media_url`, descrição enviada se modelo suportar vision |
| audio | Salvo como `media_url`, transcrito via Gemini antes de enviar ao LLM |
| video | Salvo, notifica operador no inbox |
| document | Salvo, texto extraído se PDF/TXT |
| sticker/location | Salvo como metadata, agente responde com fallback |

---

## 10. Variáveis de Ambiente

### `agente-crm` (Railway)

```bash
# Supabase (mesmo do crm-seguros)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redis (Railway Redis add-on)
REDIS_URL=redis://...

# Evolution API
EVOLUTION_API_URL=https://evolution.seudominio.com
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_WEBHOOK_SECRET=webhook-secret

# LLM (fallback global — org pode configurar a sua no dashboard)
GOOGLE_AI_API_KEY=sua-chave-gemini
OPENAI_API_KEY=opcional
ANTHROPIC_API_KEY=opcional

# App
API_PORT=3001
NODE_ENV=production
```

### `crm-seguros` (adições ao .env.local)

```bash
# Endpoint do agente-crm API (BFF)
AGENTE_CRM_API_URL=https://api.agente-crm.railway.app
AGENTE_CRM_API_SECRET=secret-compartilhado
```

---

## 11. Deploy — Railway

```
Railway Project: agente-crm
├── Service: api          (apps/api — Fastify, porta 3001)
├── Service: worker       (apps/worker — BullMQ, sem porta pública)
├── Service: redis        (Redis add-on nativo do Railway)
└── Service: evolution    (Evolution API v2 — imagem Docker oficial)
```

- O `apps/web` do professor **não existe** — dashboard já vive no `crm-seguros`
- Evolution API configurada com webhook apontando para a URL pública da `api` do Railway
- HTTPS automático pelo Railway (sem Nginx/Caddy necessário)
- Deploy automático via push no branch `main` do repositório `agente-crm`

---

## 12. Fases de Implementação

| Fase | Descrição | Local |
|------|-----------|-------|
| 1 | **Fundação** — Monorepo Turborepo, Docker Compose local, packages shared/database/queue, migrations SQL completas + RLS + pgvector | `agente-crm/` |
| 2 | **Backend Core** — API Fastify com webhook Evolution (idempotência, roteamento dual-mode), serviços, filas BullMQ | `agente-crm/apps/api` |
| 3 | **Worker & Agente** — Workers BullMQ (lock por conversa), AI SDK Gemini, MPA runner, attendance runner, tools do CRM, RAG pipeline, embeddings | `agente-crm/apps/worker` |
| 4 | **Dashboard Auth & Layout** — Integrar no crm-seguros: sidebar atualizada, layout `/whatsapp`, BFF API routes, Supabase Realtime setup | `crm-seguros/` |
| 5 | **Dashboard: Agentes** — CRUD agentes, config de modo/prompt/modelo, upload docs knowledge base (via BFF), FAQs, vincular a instância | `crm-seguros/` |
| 6 | **Dashboard: Evolution** — Gestão de instâncias, QR code realtime, status, vincular agente, mapeamento corretor → telefone | `crm-seguros/` |
| 7 | **Dashboard: Inbox** — Lista conversas com filtros, chat realtime, takeover/devolução, notas, tags, link para lead no CRM | `crm-seguros/` |
| 8 | **Dashboard: Configurações** — API keys providers, mapeamento corretor/telefone, config global | `crm-seguros/` |

Cada fase gera um plano de implementação independente executável com `writing-plans`.

---

## 13. Decisões Técnicas e Justificativas

| Decisão | Razão |
|---------|-------|
| Gemini 1.5 Flash como padrão | Gratuito na cota generosa, suporta 1M tokens de contexto, bom para português |
| Embedding `vector(768)` | Dimensão do `text-embedding-004` do Google (mais eficiente que 1536 do OpenAI) |
| Prefixo "MPA " para modo assistente | Evita processamento duplo de mensagens do próprio sistema |
| Todas novas tabelas com prefixo `wa_` | Isola tabelas WhatsApp das tabelas CRM existentes sem conflito de nomes |
| `wa_contacts.lead_id` FK para `leads` | Liga contato WhatsApp ao lead do CRM sem duplicar dados |
| Service role no worker | Worker não tem sessão de usuário — acessa Supabase com permissão total via env var |
| Railway em vez de VPS | Sem gerenciar servidor, Redis nativo, HTTPS automático, ~$5-15/mês |
| pnpm + Turborepo | Build cache, workspace linking entre packages, padrão do professor |
