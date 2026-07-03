# Fase 1: Fundação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o monorepo `agente-crm` no Desktop com Turborepo + pnpm, todos os packages compartilhados (shared, database, queue), migrations SQL completas para o Supabase existente (tabelas `wa_*` + RLS + pgvector), e Docker Compose para desenvolvimento local.

**Architecture:** Monorepo Turborepo com 2 apps (`api`, `worker`) e 3 packages (`shared`, `database`, `queue`). As migrations criam todas as tabelas novas com prefixo `wa_` no mesmo Supabase do `crm-seguros`. Redis local via Docker para desenvolvimento.

**Tech Stack:** TypeScript 5, Turborepo 2.5, pnpm 9.15, Node 20, Zod 3, @supabase/supabase-js 2, BullMQ 5, ioredis 5, Redis 7 (Docker), Vitest 3

## Global Constraints

- Pasta raiz do projeto: `C:\Users\Andreia Ferreira\Desktop\agente-crm\`
- Node version: 20 (`.nvmrc`)
- Package manager: pnpm 9.15.0
- Package names: `@agente-crm/api`, `@agente-crm/worker`, `@agente-crm/shared`, `@agente-crm/database`, `@agente-crm/queue`
- Embedding dimension: `vector(768)` (Gemini `text-embedding-004`)
- Todas as novas tabelas com prefixo `wa_`
- Supabase existente do `crm-seguros` (mesma URL, mesmas credenciais)
- TypeScript: `"strict": true` em todos os tsconfigs
- Nunca commitar `.env` — apenas `.env.example`

---

### Task 1: Inicializar Monorepo com Turborepo + pnpm

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `.nvmrc`

- [ ] **Step 1: Criar pasta e inicializar git**

```bash
mkdir -p "C:\Users\Andreia Ferreira\Desktop\agente-crm"
cd "C:\Users\Andreia Ferreira\Desktop\agente-crm"
git init
```

Expected: `Initialized empty Git repository in .../agente-crm/.git/`

- [ ] **Step 2: Criar pnpm-workspace.yaml**

Criar `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Criar package.json raiz**

Criar `package.json`:
```json
{
  "name": "agente-crm",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "dev:api": "turbo dev --filter=@agente-crm/api",
    "dev:worker": "turbo dev --filter=@agente-crm/worker"
  },
  "devDependencies": {
    "turbo": "^2.5.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 4: Criar turbo.json**

Criar `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 5: Criar .nvmrc**

Criar `.nvmrc`:
```
20
```

- [ ] **Step 6: Criar .gitignore**

Criar `.gitignore`:
```gitignore
node_modules/
dist/
.turbo/
.next/
.env
.env.local
*.log
.DS_Store
Thumbs.db
coverage/
```

- [ ] **Step 7: Criar .env.example**

Criar `.env.example`:
```bash
# Supabase (mesmo projeto do crm-seguros)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redis
REDIS_URL=redis://localhost:6379

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_WEBHOOK_SECRET=webhook-secret

# LLM (fallback global)
GOOGLE_AI_API_KEY=sua-chave-gemini
OPENAI_API_KEY=opcional
ANTHROPIC_API_KEY=opcional

# App
API_PORT=3001
NODE_ENV=development
```

- [ ] **Step 8: Criar estrutura de diretórios**

```bash
mkdir -p apps/api apps/worker packages/shared packages/database packages/queue supabase/migrations
```

- [ ] **Step 9: Instalar Turborepo e verificar**

```bash
pnpm install
```

Expected: `node_modules/.pnpm/...` criado, sem erros.

- [ ] **Step 10: Commit inicial**

```bash
git add .
git commit -m "feat: initialize agente-crm monorepo with turborepo and pnpm"
```

---

### Task 2: Package `@agente-crm/shared` — Tipos, Constantes e Schemas Zod

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/types/organization.ts`
- Create: `packages/shared/src/types/agent.ts`
- Create: `packages/shared/src/types/contact.ts`
- Create: `packages/shared/src/types/conversation.ts`
- Create: `packages/shared/src/types/message.ts`
- Create: `packages/shared/src/types/evolution.ts`
- Create: `packages/shared/src/types/knowledge.ts`
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/constants.ts`
- Create: `packages/shared/src/schemas/organization.ts`
- Create: `packages/shared/src/schemas/agent.ts`
- Create: `packages/shared/src/schemas/conversation.ts`
- Create: `packages/shared/src/schemas/message.ts`
- Create: `packages/shared/src/schemas/contact.ts`
- Create: `packages/shared/src/schemas/evolution.ts`
- Create: `packages/shared/src/schemas/knowledge.ts`
- Create: `packages/shared/src/schemas/index.ts`
- Create: `packages/shared/src/index.ts`
- Test: `packages/shared/src/schemas.test.ts`

**Interfaces:**
- Produces: todos os tipos TypeScript e schemas Zod usados pelos demais packages

- [ ] **Step 1: Criar package.json**

Criar `packages/shared/package.json`:
```json
{
  "name": "@agente-crm/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Criar tsconfig.json**

Criar `packages/shared/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Criar tipos de Organization**

Criar `packages/shared/src/types/organization.ts`:
```typescript
export type MemberRole = "owner" | "admin" | "agent";
export type LLMProvider = "openai" | "anthropic" | "google";

export interface WaOrganization {
  id: string;
  name: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WaOrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  whatsapp_phone: string | null;
  created_at: string;
}
```

- [ ] **Step 4: Criar tipos de Agent**

Criar `packages/shared/src/types/agent.ts`:
```typescript
import type { LLMProvider } from "./organization";

export type AgentMode = "mpa" | "client_attendance";

export interface AgentToolsConfig {
  search_knowledge: boolean;
  search_faq: boolean;
  crm_access: boolean;
  create_lead: boolean;
}

export interface WaAgent {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  system_prompt: string;
  mode: AgentMode;
  model: string;
  provider: LLMProvider;
  temperature: number;
  max_tokens: number;
  tools_config: AgentToolsConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 5: Criar tipos de Contact**

Criar `packages/shared/src/types/contact.ts`:
```typescript
export interface WaContact {
  id: string;
  organization_id: string;
  phone: string;
  name: string | null;
  photo_url: string | null;
  lead_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 6: Criar tipos de Conversation**

Criar `packages/shared/src/types/conversation.ts`:
```typescript
import type { AgentMode } from "./agent";

export type ConversationStatus = "open" | "waiting" | "resolved" | "closed";

export interface WaConversation {
  id: string;
  organization_id: string;
  agent_id: string;
  evolution_instance_id: string;
  contact_id: string;
  mode: AgentMode;
  status: ConversationStatus;
  is_human_takeover: boolean;
  human_takeover_at: string | null;
  assigned_to: string | null;
  tags: string[];
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface WaConversationNote {
  id: string;
  conversation_id: string;
  organization_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 7: Criar tipos de Message**

Criar `packages/shared/src/types/message.ts`:
```typescript
export type MessageRole = "contact" | "agent" | "human_agent" | "system";
export type MediaType = "text" | "image" | "audio" | "video" | "document" | "sticker" | "location";

export interface MessageMetadata {
  model?: string;
  tokens_used?: number;
  latency_ms?: number;
  tool_calls?: string[];
}

export interface WaMessage {
  id: string;
  conversation_id: string;
  organization_id: string;
  evolution_message_id: string | null;
  role: MessageRole;
  content: string;
  media_url: string | null;
  media_type: MediaType | null;
  metadata: MessageMetadata | null;
  created_at: string;
}
```

- [ ] **Step 8: Criar tipos de Evolution**

Criar `packages/shared/src/types/evolution.ts`:
```typescript
export type InstanceStatus = "connected" | "disconnected" | "connecting";

export interface WaEvolutionInstance {
  id: string;
  organization_id: string;
  instance_name: string;
  instance_id: string;
  status: InstanceStatus;
  phone_number: string | null;
  webhook_url: string | null;
  active_agent_id: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 9: Criar tipos de Knowledge**

Criar `packages/shared/src/types/knowledge.ts`:
```typescript
export type DocumentStatus = "processing" | "ready" | "error";
export type DocumentFileType = "pdf" | "txt" | "md" | "docx" | "csv";

export interface WaKnowledgeDocument {
  id: string;
  agent_id: string;
  organization_id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_type: DocumentFileType;
  file_size_bytes: number;
  status: DocumentStatus;
  error_message: string | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface WaKnowledgeFaq {
  id: string;
  agent_id: string;
  organization_id: string;
  question: string;
  answer: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 10: Criar barrel de tipos**

Criar `packages/shared/src/types/index.ts`:
```typescript
export * from "./organization";
export * from "./agent";
export * from "./contact";
export * from "./conversation";
export * from "./message";
export * from "./evolution";
export * from "./knowledge";
```

- [ ] **Step 11: Criar constants.ts**

Criar `packages/shared/src/constants.ts`:
```typescript
export const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const ALLOWED_DOCUMENT_TYPES = ["pdf", "txt", "md", "docx", "csv"] as const;

export const HUMAN_TAKEOVER_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const EMBEDDING_DIMENSION = 768; // Gemini text-embedding-004

export const QUEUE_NAMES = {
  PROCESS_MESSAGE: "process-message",
  SEND_MESSAGE: "send-message",
  PROCESS_DOCUMENT: "process-document",
  TAKEOVER_TIMEOUT: "takeover-timeout",
} as const;

export const DEFAULT_AGENT_SETTINGS = {
  temperature: 0.7,
  max_tokens: 1024,
  model: "gemini-1.5-flash",
  provider: "google" as const,
} as const;
```

- [ ] **Step 12: Criar schemas Zod — Agent**

Criar `packages/shared/src/schemas/agent.ts`:
```typescript
import { z } from "zod";

export const agentToolsConfigSchema = z.object({
  search_knowledge: z.boolean().default(true),
  search_faq: z.boolean().default(true),
  crm_access: z.boolean().default(false),
  create_lead: z.boolean().default(false),
});

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  system_prompt: z.string().min(1),
  mode: z.enum(["mpa", "client_attendance"]),
  model: z.string().min(1).default("gemini-1.5-flash"),
  provider: z.enum(["openai", "anthropic", "google"]).default("google"),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().min(1).max(32768).default(1024),
  tools_config: agentToolsConfigSchema.default({
    search_knowledge: true,
    search_faq: true,
    crm_access: false,
    create_lead: false,
  }),
});

export const updateAgentSchema = createAgentSchema.partial();
```

- [ ] **Step 13: Criar schemas Zod — Conversation**

Criar `packages/shared/src/schemas/conversation.ts`:
```typescript
import { z } from "zod";

export const updateConversationSchema = z.object({
  status: z.enum(["open", "waiting", "resolved", "closed"]).optional(),
  is_human_takeover: z.boolean().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const createNoteSchema = z.object({
  content: z.string().min(1).max(5000),
});
```

- [ ] **Step 14: Criar schemas Zod — Message**

Criar `packages/shared/src/schemas/message.ts`:
```typescript
import { z } from "zod";

export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(10000),
});
```

- [ ] **Step 15: Criar schemas Zod — Contact**

Criar `packages/shared/src/schemas/contact.ts`:
```typescript
import { z } from "zod";

export const upsertContactSchema = z.object({
  phone: z.string().min(10).max(20),
  name: z.string().max(200).nullable().default(null),
  photo_url: z.string().url().nullable().default(null),
  metadata: z.record(z.unknown()).default({}),
});
```

- [ ] **Step 16: Criar schemas Zod — Evolution**

Criar `packages/shared/src/schemas/evolution.ts`:
```typescript
import { z } from "zod";

export const createInstanceSchema = z.object({
  instance_name: z.string().min(1).max(100),
});

export const evolutionWebhookPayloadSchema = z.object({
  event: z.string(),
  instance: z.string(),
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean(),
      id: z.string(),
    }),
    message: z
      .object({
        conversation: z.string().optional(),
        imageMessage: z.object({ caption: z.string().optional() }).optional(),
        audioMessage: z.object({}).optional(),
        videoMessage: z.object({ caption: z.string().optional() }).optional(),
        documentMessage: z.object({ fileName: z.string().optional() }).optional(),
        stickerMessage: z.object({}).optional(),
      })
      .passthrough()
      .optional(),
    messageType: z.string(),
    pushName: z.string().optional(),
    messageTimestamp: z.number().optional(),
  }),
});

export type EvolutionWebhookPayload = z.infer<typeof evolutionWebhookPayloadSchema>;
```

- [ ] **Step 17: Criar schemas Zod — Knowledge**

Criar `packages/shared/src/schemas/knowledge.ts`:
```typescript
import { z } from "zod";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "../constants";

export const uploadDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  agent_id: z.string().uuid(),
});

export const validateDocumentFileSchema = z.object({
  file_name: z.string().min(1),
  file_size_bytes: z.number().int().positive().max(MAX_DOCUMENT_SIZE_BYTES),
  file_type: z.enum(ALLOWED_DOCUMENT_TYPES),
});

export const createFaqSchema = z.object({
  agent_id: z.string().uuid(),
  question: z.string().min(1).max(1000),
  answer: z.string().min(1).max(5000),
});

export const updateFaqSchema = z.object({
  question: z.string().min(1).max(1000).optional(),
  answer: z.string().min(1).max(5000).optional(),
  is_active: z.boolean().optional(),
});
```

- [ ] **Step 18: Criar schemas Zod — Organization**

Criar `packages/shared/src/schemas/organization.ts`:
```typescript
import { z } from "zod";

export const updateMemberSchema = z.object({
  role: z.enum(["owner", "admin", "agent"]),
  whatsapp_phone: z.string().min(10).max(20).nullable().optional(),
});
```

- [ ] **Step 19: Criar barrels de schemas e index principal**

Criar `packages/shared/src/schemas/index.ts`:
```typescript
export * from "./agent";
export * from "./conversation";
export * from "./message";
export * from "./contact";
export * from "./evolution";
export * from "./knowledge";
export * from "./organization";
```

Criar `packages/shared/src/index.ts`:
```typescript
export * from "./types/index";
export * from "./schemas/index";
export * from "./constants";
```

- [ ] **Step 20: Escrever testes dos schemas**

Criar `packages/shared/src/schemas.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { createAgentSchema, evolutionWebhookPayloadSchema, uploadDocumentSchema } from "./schemas/index";

describe("createAgentSchema", () => {
  it("aceita agente MPA válido", () => {
    const result = createAgentSchema.safeParse({
      name: "MPA Assistant",
      system_prompt: "Você é o MPA.",
      mode: "mpa",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.provider).toBe("google");
      expect(result.data.model).toBe("gemini-1.5-flash");
    }
  });

  it("rejeita agente sem nome", () => {
    const result = createAgentSchema.safeParse({
      system_prompt: "Você é o MPA.",
      mode: "mpa",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita mode inválido", () => {
    const result = createAgentSchema.safeParse({
      name: "Agent",
      system_prompt: "...",
      mode: "invalid_mode",
    });
    expect(result.success).toBe(false);
  });
});

describe("evolutionWebhookPayloadSchema", () => {
  it("valida payload mínimo de mensagem de texto", () => {
    const payload = {
      event: "messages.upsert",
      instance: "minha-instancia",
      data: {
        key: { remoteJid: "5511999990000@s.whatsapp.net", fromMe: false, id: "ABC123" },
        messageType: "conversation",
        message: { conversation: "Olá, preciso de um plano" },
      },
    };
    const result = evolutionWebhookPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

describe("uploadDocumentSchema", () => {
  it("valida upload válido", () => {
    const result = uploadDocumentSchema.safeParse({
      title: "Agente de Prospecção",
      agent_id: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 21: Instalar dependências e rodar testes**

```bash
cd packages/shared && pnpm install
```

```bash
pnpm test
```

Expected: `3 passed` (3 describes, todos os testes passando)

- [ ] **Step 22: Verificar typecheck**

```bash
pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 23: Commit**

```bash
cd ../..
git add packages/shared/
git commit -m "feat: add @agente-crm/shared package with types, schemas, and constants"
```

---

### Task 3: Package `@agente-crm/database` — Supabase Client + Queries

**Files:**
- Create: `packages/database/package.json`
- Create: `packages/database/tsconfig.json`
- Create: `packages/database/src/client.ts`
- Create: `packages/database/src/admin.ts`
- Create: `packages/database/src/queries/organizations.ts`
- Create: `packages/database/src/queries/agents.ts`
- Create: `packages/database/src/queries/contacts.ts`
- Create: `packages/database/src/queries/conversations.ts`
- Create: `packages/database/src/queries/messages.ts`
- Create: `packages/database/src/queries/evolution-instances.ts`
- Create: `packages/database/src/queries/knowledge.ts`
- Create: `packages/database/src/queries/index.ts`
- Create: `packages/database/src/index.ts`

**Interfaces:**
- Consumes: tipos de `@agente-crm/shared`
- Produces: `createSupabaseClient`, `getAdminClient`, todas as funções de query usadas por api e worker

- [ ] **Step 1: Criar package.json**

Criar `packages/database/package.json`:
```json
{
  "name": "@agente-crm/database",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.0",
    "@agente-crm/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Criar tsconfig.json**

Criar `packages/database/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Criar client.ts (anon key — dashboard)**

Criar `packages/database/src/client.ts`:
```typescript
import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient(url: string, anonKey: string) {
  return createClient(url, anonKey);
}
```

- [ ] **Step 4: Criar admin.ts (service_role — worker)**

Criar `packages/database/src/admin.ts`:
```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}
```

- [ ] **Step 5: Criar queries/organizations.ts**

Criar `packages/database/src/queries/organizations.ts`:
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WaOrganization, WaOrganizationMember } from "@agente-crm/shared";

export async function getOrganizationById(client: SupabaseClient, id: string) {
  const { data, error } = await client.from("wa_organizations").select("*").eq("id", id).single();
  if (error) throw error;
  return data as WaOrganization;
}

export async function getOrganizationMembers(client: SupabaseClient, organizationId: string) {
  const { data, error } = await client
    .from("wa_organization_members")
    .select("*")
    .eq("organization_id", organizationId);
  if (error) throw error;
  return data as WaOrganizationMember[];
}

export async function getCorretorByPhone(client: SupabaseClient, phone: string) {
  const { data, error } = await client
    .from("wa_organization_members")
    .select("*")
    .eq("whatsapp_phone", phone)
    .maybeSingle();
  if (error) throw error;
  return data as WaOrganizationMember | null;
}

export async function getRegisteredPhones(client: SupabaseClient, organizationId: string): Promise<string[]> {
  const { data, error } = await client
    .from("wa_organization_members")
    .select("whatsapp_phone")
    .eq("organization_id", organizationId)
    .not("whatsapp_phone", "is", null);
  if (error) throw error;
  return (data ?? []).map((r) => r.whatsapp_phone as string);
}
```

- [ ] **Step 6: Criar queries/agents.ts**

Criar `packages/database/src/queries/agents.ts`:
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WaAgent } from "@agente-crm/shared";

export async function getAgentsByOrganization(client: SupabaseClient, organizationId: string) {
  const { data, error } = await client
    .from("wa_agents")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as WaAgent[];
}

export async function getAgentById(client: SupabaseClient, id: string) {
  const { data, error } = await client.from("wa_agents").select("*").eq("id", id).single();
  if (error) throw error;
  return data as WaAgent;
}

export async function createAgent(client: SupabaseClient, agent: Omit<WaAgent, "id" | "created_at" | "updated_at">) {
  const { data, error } = await client.from("wa_agents").insert(agent).select().single();
  if (error) throw error;
  return data as WaAgent;
}

export async function updateAgent(client: SupabaseClient, id: string, updates: Partial<WaAgent>) {
  const { data, error } = await client.from("wa_agents").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as WaAgent;
}

export async function deleteAgent(client: SupabaseClient, id: string) {
  const { error } = await client.from("wa_agents").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 7: Criar queries/contacts.ts**

Criar `packages/database/src/queries/contacts.ts`:
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WaContact } from "@agente-crm/shared";

export async function upsertContact(
  client: SupabaseClient,
  organizationId: string,
  phone: string,
  name: string | null,
  photoUrl: string | null
) {
  const { data, error } = await client
    .from("wa_contacts")
    .upsert(
      { organization_id: organizationId, phone, name, photo_url: photoUrl },
      { onConflict: "organization_id,phone" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as WaContact;
}

export async function getContactByPhone(client: SupabaseClient, organizationId: string, phone: string) {
  const { data, error } = await client
    .from("wa_contacts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("phone", phone)
    .maybeSingle();
  if (error) throw error;
  return data as WaContact | null;
}

export async function updateContactLeadId(client: SupabaseClient, contactId: string, leadId: string) {
  const { error } = await client.from("wa_contacts").update({ lead_id: leadId }).eq("id", contactId);
  if (error) throw error;
}
```

- [ ] **Step 8: Criar queries/conversations.ts**

Criar `packages/database/src/queries/conversations.ts`:
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WaConversation, WaConversationNote, AgentMode } from "@agente-crm/shared";

export async function getConversationsByOrganization(
  client: SupabaseClient,
  organizationId: string,
  status?: string
) {
  let query = client
    .from("wa_conversations")
    .select("*, wa_contacts(*)")
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getConversationById(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from("wa_conversations")
    .select("*, wa_contacts(*), wa_agents(name, mode)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function findOpenConversation(
  client: SupabaseClient,
  contactId: string,
  agentId: string
) {
  const { data, error } = await client
    .from("wa_conversations")
    .select("*")
    .eq("contact_id", contactId)
    .eq("agent_id", agentId)
    .in("status", ["open", "waiting"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as WaConversation | null;
}

export async function createConversation(
  client: SupabaseClient,
  conversation: Omit<WaConversation, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await client.from("wa_conversations").insert(conversation).select().single();
  if (error) throw error;
  return data as WaConversation;
}

export async function updateConversation(client: SupabaseClient, id: string, updates: Partial<WaConversation>) {
  const { data, error } = await client.from("wa_conversations").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as WaConversation;
}

export async function getExpiredTakeovers(client: SupabaseClient, timeoutMs: number) {
  const cutoff = new Date(Date.now() - timeoutMs).toISOString();
  const { data, error } = await client
    .from("wa_conversations")
    .select("*")
    .eq("is_human_takeover", true)
    .lt("human_takeover_at", cutoff);
  if (error) throw error;
  return data as WaConversation[];
}

export async function addConversationNote(
  client: SupabaseClient,
  note: Omit<WaConversationNote, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await client.from("wa_conversation_notes").insert(note).select().single();
  if (error) throw error;
  return data as WaConversationNote;
}
```

- [ ] **Step 9: Criar queries/messages.ts**

Criar `packages/database/src/queries/messages.ts`:
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WaMessage } from "@agente-crm/shared";

export async function getRecentMessages(client: SupabaseClient, conversationId: string, limit = 20) {
  const { data, error } = await client
    .from("wa_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as WaMessage[]).reverse();
}

export async function getAllMessages(client: SupabaseClient, conversationId: string) {
  const { data, error } = await client
    .from("wa_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as WaMessage[];
}

export async function createMessage(client: SupabaseClient, message: Omit<WaMessage, "id" | "created_at">) {
  const { data, error } = await client.from("wa_messages").insert(message).select().single();
  if (error) throw error;
  return data as WaMessage;
}

export async function messageExistsByEvolutionId(client: SupabaseClient, evolutionMessageId: string) {
  const { data, error } = await client
    .from("wa_messages")
    .select("id")
    .eq("evolution_message_id", evolutionMessageId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}
```

- [ ] **Step 10: Criar queries/evolution-instances.ts**

Criar `packages/database/src/queries/evolution-instances.ts`:
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WaEvolutionInstance } from "@agente-crm/shared";

export async function getInstancesByOrganization(client: SupabaseClient, organizationId: string) {
  const { data, error } = await client
    .from("wa_evolution_instances")
    .select("*, wa_agents:active_agent_id(id, name, mode)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getInstanceByInstanceId(client: SupabaseClient, instanceId: string) {
  const { data, error } = await client
    .from("wa_evolution_instances")
    .select("*")
    .eq("instance_id", instanceId)
    .single();
  if (error) throw error;
  return data as WaEvolutionInstance;
}

export async function createInstance(
  client: SupabaseClient,
  instance: Pick<WaEvolutionInstance, "organization_id" | "instance_name" | "instance_id" | "webhook_url">
) {
  const { data, error } = await client
    .from("wa_evolution_instances")
    .insert({ ...instance, status: "disconnected" })
    .select()
    .single();
  if (error) throw error;
  return data as WaEvolutionInstance;
}

export async function updateInstance(client: SupabaseClient, id: string, updates: Partial<WaEvolutionInstance>) {
  const { data, error } = await client
    .from("wa_evolution_instances")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as WaEvolutionInstance;
}

export async function deleteInstance(client: SupabaseClient, id: string) {
  const { error } = await client.from("wa_evolution_instances").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 11: Criar queries/knowledge.ts**

Criar `packages/database/src/queries/knowledge.ts`:
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WaKnowledgeDocument, WaKnowledgeFaq } from "@agente-crm/shared";

export async function getDocumentsByAgent(client: SupabaseClient, agentId: string) {
  const { data, error } = await client
    .from("wa_knowledge_documents")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as WaKnowledgeDocument[];
}

export async function createDocument(
  client: SupabaseClient,
  doc: Omit<WaKnowledgeDocument, "id" | "created_at" | "updated_at" | "chunk_count" | "error_message">
) {
  const { data, error } = await client
    .from("wa_knowledge_documents")
    .insert({ ...doc, chunk_count: 0 })
    .select()
    .single();
  if (error) throw error;
  return data as WaKnowledgeDocument;
}

export async function updateDocument(client: SupabaseClient, id: string, updates: Partial<WaKnowledgeDocument>) {
  const { data, error } = await client
    .from("wa_knowledge_documents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as WaKnowledgeDocument;
}

export async function deleteDocument(client: SupabaseClient, id: string) {
  await client.from("wa_knowledge_chunks").delete().eq("document_id", id);
  const { error } = await client.from("wa_knowledge_documents").delete().eq("id", id);
  if (error) throw error;
}

export async function insertChunks(
  client: SupabaseClient,
  chunks: Array<{
    document_id: string;
    organization_id: string;
    content: string;
    metadata: Record<string, unknown>;
    embedding: number[];
    chunk_index: number;
  }>
) {
  const { error } = await client.from("wa_knowledge_chunks").insert(chunks);
  if (error) throw error;
}

export async function searchKnowledge(
  client: SupabaseClient,
  organizationId: string,
  agentId: string,
  embedding: number[],
  limit = 5
) {
  const { data, error } = await client.rpc("wa_search_knowledge", {
    query_embedding: embedding,
    match_count: limit,
    filter_organization_id: organizationId,
    filter_agent_id: agentId,
  });
  if (error) throw error;
  return data as Array<{ id: string; content: string; similarity: number }>;
}

export async function getFaqsByAgent(client: SupabaseClient, agentId: string) {
  const { data, error } = await client
    .from("wa_knowledge_faqs")
    .select("*")
    .eq("agent_id", agentId)
    .eq("is_active", true);
  if (error) throw error;
  return data as WaKnowledgeFaq[];
}

export async function createFaq(client: SupabaseClient, faq: Omit<WaKnowledgeFaq, "id" | "created_at" | "updated_at">) {
  const { data, error } = await client.from("wa_knowledge_faqs").insert(faq).select().single();
  if (error) throw error;
  return data as WaKnowledgeFaq;
}

export async function updateFaq(client: SupabaseClient, id: string, updates: Partial<WaKnowledgeFaq>) {
  const { data, error } = await client.from("wa_knowledge_faqs").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as WaKnowledgeFaq;
}

export async function deleteFaq(client: SupabaseClient, id: string) {
  const { error } = await client.from("wa_knowledge_faqs").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 12: Criar barrels**

Criar `packages/database/src/queries/index.ts`:
```typescript
export * from "./organizations";
export * from "./agents";
export * from "./contacts";
export * from "./conversations";
export * from "./messages";
export * from "./evolution-instances";
export * from "./knowledge";
```

Criar `packages/database/src/index.ts`:
```typescript
export { createSupabaseClient } from "./client";
export { getAdminClient } from "./admin";
export * from "./queries/index";
```

- [ ] **Step 13: Instalar e verificar typecheck**

```bash
cd packages/database && pnpm install && pnpm typecheck
```

Expected: sem erros de tipo.

- [ ] **Step 14: Commit**

```bash
cd ../..
git add packages/database/
git commit -m "feat: add @agente-crm/database package with supabase client and queries"
```

---

### Task 4: Package `@agente-crm/queue` — Definições BullMQ

**Files:**
- Create: `packages/queue/package.json`
- Create: `packages/queue/tsconfig.json`
- Create: `packages/queue/src/connection.ts`
- Create: `packages/queue/src/types.ts`
- Create: `packages/queue/src/queues.ts`
- Create: `packages/queue/src/index.ts`

**Interfaces:**
- Consumes: `QUEUE_NAMES` de `@agente-crm/shared`
- Produces: `getProcessMessageQueue`, `getSendMessageQueue`, `getProcessDocumentQueue`, `getTakeoverTimeoutQueue`, `getRedisConnection`; tipos `ProcessMessageJobData`, `SendMessageJobData`, `ProcessDocumentJobData`

- [ ] **Step 1: Criar package.json**

Criar `packages/queue/package.json`:
```json
{
  "name": "@agente-crm/queue",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "bullmq": "^5.30.0",
    "ioredis": "^5.4.0",
    "@agente-crm/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Criar tsconfig.json**

Criar `packages/queue/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Criar connection.ts**

Criar `packages/queue/src/connection.ts`:
```typescript
import IORedis from "ioredis";

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (connection) return connection;
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  return connection;
}
```

- [ ] **Step 4: Criar types.ts**

Criar `packages/queue/src/types.ts`:
```typescript
import type { AgentMode } from "@agente-crm/shared";

export interface ProcessMessageJobData {
  conversationId: string;
  messageId: string;
  agentId: string;
  organizationId: string;
  mode: AgentMode;
  corretorUserId: string | null;  // preenchido quando mode = 'mpa'
}

export interface SendMessageJobData {
  conversationId: string;
  messageId: string;
  instanceId: string;
  phone: string;
  content: string;
  organizationId: string;
}

export interface ProcessDocumentJobData {
  documentId: string;
  organizationId: string;
  agentId: string;
}
```

- [ ] **Step 5: Criar queues.ts**

Criar `packages/queue/src/queues.ts`:
```typescript
import { Queue } from "bullmq";
import { QUEUE_NAMES } from "@agente-crm/shared";
import { getRedisConnection } from "./connection";
import type { ProcessMessageJobData, SendMessageJobData, ProcessDocumentJobData } from "./types";

const defaultRetryOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
};

let processMessageQueue: Queue<ProcessMessageJobData> | null = null;
let sendMessageQueue: Queue<SendMessageJobData> | null = null;
let processDocumentQueue: Queue<ProcessDocumentJobData> | null = null;
let takeoverTimeoutQueue: Queue | null = null;

export function getProcessMessageQueue() {
  if (!processMessageQueue) {
    processMessageQueue = new Queue<ProcessMessageJobData>(QUEUE_NAMES.PROCESS_MESSAGE, {
      connection: getRedisConnection(),
      defaultJobOptions: defaultRetryOptions,
    });
  }
  return processMessageQueue;
}

export function getSendMessageQueue() {
  if (!sendMessageQueue) {
    sendMessageQueue = new Queue<SendMessageJobData>(QUEUE_NAMES.SEND_MESSAGE, {
      connection: getRedisConnection(),
      defaultJobOptions: { ...defaultRetryOptions, backoff: { type: "exponential", delay: 1000 } },
    });
  }
  return sendMessageQueue;
}

export function getProcessDocumentQueue() {
  if (!processDocumentQueue) {
    processDocumentQueue = new Queue<ProcessDocumentJobData>(QUEUE_NAMES.PROCESS_DOCUMENT, {
      connection: getRedisConnection(),
      defaultJobOptions: { attempts: 2, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: { count: 500 }, removeOnFail: { count: 1000 } },
    });
  }
  return processDocumentQueue;
}

export function getTakeoverTimeoutQueue() {
  if (!takeoverTimeoutQueue) {
    takeoverTimeoutQueue = new Queue(QUEUE_NAMES.TAKEOVER_TIMEOUT, {
      connection: getRedisConnection(),
    });
  }
  return takeoverTimeoutQueue;
}
```

- [ ] **Step 6: Criar index.ts**

Criar `packages/queue/src/index.ts`:
```typescript
export { getRedisConnection } from "./connection";
export {
  getProcessMessageQueue,
  getSendMessageQueue,
  getProcessDocumentQueue,
  getTakeoverTimeoutQueue,
} from "./queues";
export type { ProcessMessageJobData, SendMessageJobData, ProcessDocumentJobData } from "./types";
```

- [ ] **Step 7: Instalar e verificar typecheck**

```bash
cd packages/queue && pnpm install && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
cd ../..
git add packages/queue/
git commit -m "feat: add @agente-crm/queue package with BullMQ queue definitions"
```

---

### Task 5: Supabase Migrations — Todas as Tabelas `wa_*`

**Files:**
- Create: `supabase/migrations/00001_enable_extensions.sql`
- Create: `supabase/migrations/00002_wa_organizations.sql`
- Create: `supabase/migrations/00003_wa_contacts.sql`
- Create: `supabase/migrations/00004_wa_agents.sql`
- Create: `supabase/migrations/00005_wa_evolution_instances.sql`
- Create: `supabase/migrations/00006_wa_knowledge.sql`
- Create: `supabase/migrations/00007_wa_conversations.sql`
- Create: `supabase/migrations/00008_wa_rls_policies.sql`
- Create: `supabase/migrations/00009_wa_functions.sql`

**Nota:** As migrations são aplicadas no Supabase existente do `crm-seguros`. Copiar a URL e as credenciais do arquivo `.env.local` do `crm-seguros`. Todas as tabelas têm prefixo `wa_` para não conflitar com tabelas existentes (`leads`, `clientes`, etc.).

- [ ] **Step 1: Criar migration — Extensions**

Criar `supabase/migrations/00001_enable_extensions.sql`:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

- [ ] **Step 2: Criar migration — Organizations**

Criar `supabase/migrations/00002_wa_organizations.sql`:
```sql
CREATE TABLE wa_organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wa_organization_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'agent')) DEFAULT 'agent',
  whatsapp_phone text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE wa_provider_secrets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google')),
  encrypted_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider)
);

CREATE OR REPLACE FUNCTION update_wa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wa_organizations_updated_at
  BEFORE UPDATE ON wa_organizations
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

CREATE TRIGGER trg_wa_provider_secrets_updated_at
  BEFORE UPDATE ON wa_provider_secrets
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

CREATE INDEX idx_wa_org_members_user ON wa_organization_members(user_id);
CREATE INDEX idx_wa_org_members_org ON wa_organization_members(organization_id);
CREATE INDEX idx_wa_org_members_phone ON wa_organization_members(whatsapp_phone) WHERE whatsapp_phone IS NOT NULL;
```

- [ ] **Step 3: Criar migration — Contacts**

Criar `supabase/migrations/00003_wa_contacts.sql`:
```sql
CREATE TABLE wa_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  phone text NOT NULL,
  name text,
  photo_url text,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, phone)
);

CREATE TRIGGER trg_wa_contacts_updated_at
  BEFORE UPDATE ON wa_contacts
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

CREATE INDEX idx_wa_contacts_org_phone ON wa_contacts(organization_id, phone);
CREATE INDEX idx_wa_contacts_lead ON wa_contacts(lead_id) WHERE lead_id IS NOT NULL;
```

- [ ] **Step 4: Criar migration — Agents**

Criar `supabase/migrations/00004_wa_agents.sql`:
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
  max_tokens integer NOT NULL DEFAULT 1024 CHECK (max_tokens > 0),
  tools_config jsonb NOT NULL DEFAULT '{"search_knowledge": true, "search_faq": true, "crm_access": false, "create_lead": false}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_wa_agents_updated_at
  BEFORE UPDATE ON wa_agents
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

CREATE INDEX idx_wa_agents_org ON wa_agents(organization_id);
```

- [ ] **Step 5: Criar migration — Evolution Instances**

Criar `supabase/migrations/00005_wa_evolution_instances.sql`:
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

CREATE TRIGGER trg_wa_evolution_instances_updated_at
  BEFORE UPDATE ON wa_evolution_instances
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

CREATE INDEX idx_wa_evolution_instances_org ON wa_evolution_instances(organization_id);
CREATE INDEX idx_wa_evolution_instances_instance_id ON wa_evolution_instances(instance_id);
```

- [ ] **Step 6: Criar migration — Knowledge**

Criar `supabase/migrations/00006_wa_knowledge.sql`:
```sql
CREATE TABLE wa_knowledge_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid NOT NULL REFERENCES wa_agents(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES wa_organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'txt', 'md', 'docx', 'csv')),
  file_size_bytes integer NOT NULL CHECK (file_size_bytes > 0),
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
  embedding vector(768) NOT NULL,
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

CREATE TRIGGER trg_wa_knowledge_docs_updated_at
  BEFORE UPDATE ON wa_knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

CREATE TRIGGER trg_wa_knowledge_faqs_updated_at
  BEFORE UPDATE ON wa_knowledge_faqs
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

CREATE INDEX idx_wa_knowledge_docs_agent ON wa_knowledge_documents(agent_id);
CREATE INDEX idx_wa_knowledge_docs_org ON wa_knowledge_documents(organization_id);
CREATE INDEX idx_wa_knowledge_chunks_doc ON wa_knowledge_chunks(document_id);
CREATE INDEX idx_wa_knowledge_chunks_org ON wa_knowledge_chunks(organization_id);
CREATE INDEX idx_wa_knowledge_faqs_agent ON wa_knowledge_faqs(agent_id);

-- HNSW index para busca vetorial (768 dimensões para Gemini text-embedding-004)
CREATE INDEX idx_wa_knowledge_chunks_embedding ON wa_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

- [ ] **Step 7: Criar migration — Conversations & Messages**

Criar `supabase/migrations/00007_wa_conversations.sql`:
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
  metadata jsonb,
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

CREATE TRIGGER trg_wa_conversations_updated_at
  BEFORE UPDATE ON wa_conversations
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

CREATE TRIGGER trg_wa_conversation_notes_updated_at
  BEFORE UPDATE ON wa_conversation_notes
  FOR EACH ROW EXECUTE FUNCTION update_wa_updated_at();

CREATE INDEX idx_wa_conversations_org_last ON wa_conversations(organization_id, last_message_at DESC);
CREATE INDEX idx_wa_conversations_org_status ON wa_conversations(organization_id, status);
CREATE INDEX idx_wa_conversations_contact ON wa_conversations(contact_id);
CREATE INDEX idx_wa_messages_conversation ON wa_messages(conversation_id, created_at);
CREATE UNIQUE INDEX idx_wa_messages_evolution_id ON wa_messages(evolution_message_id)
  WHERE evolution_message_id IS NOT NULL;
CREATE INDEX idx_wa_conversation_notes_org ON wa_conversation_notes(organization_id);
```

- [ ] **Step 8: Criar migration — RLS Policies**

Criar `supabase/migrations/00008_wa_rls_policies.sql`:
```sql
-- Habilitar RLS em todas as tabelas wa_*
ALTER TABLE wa_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_provider_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_evolution_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_conversation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_knowledge_faqs ENABLE ROW LEVEL SECURITY;

-- Helper: IDs das organizações do usuário atual
CREATE OR REPLACE FUNCTION wa_get_user_org_ids()
RETURNS SETOF uuid AS $$
  SELECT organization_id FROM wa_organization_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations
CREATE POLICY "wa_org_select" ON wa_organizations
  FOR SELECT USING (id IN (SELECT wa_get_user_org_ids()));

-- Organization Members
CREATE POLICY "wa_org_members_select" ON wa_organization_members
  FOR SELECT USING (organization_id IN (SELECT wa_get_user_org_ids()));

CREATE POLICY "wa_org_members_insert" ON wa_organization_members
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM wa_organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Provider Secrets (apenas owner/admin)
CREATE POLICY "wa_secrets_select" ON wa_provider_secrets
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM wa_organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "wa_secrets_all" ON wa_provider_secrets
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM wa_organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- RLS genérica por organization_id para demais tabelas
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'wa_agents', 'wa_evolution_instances', 'wa_contacts',
    'wa_conversations', 'wa_messages', 'wa_conversation_notes',
    'wa_knowledge_documents', 'wa_knowledge_chunks', 'wa_knowledge_faqs'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "%1$s_select" ON %1$s FOR SELECT USING (organization_id IN (SELECT wa_get_user_org_ids()))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "%1$s_insert" ON %1$s FOR INSERT WITH CHECK (organization_id IN (SELECT wa_get_user_org_ids()))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "%1$s_update" ON %1$s FOR UPDATE USING (organization_id IN (SELECT wa_get_user_org_ids()))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "%1$s_delete" ON %1$s FOR DELETE USING (organization_id IN (SELECT wa_get_user_org_ids()))',
      tbl
    );
  END LOOP;
END $$;
```

- [ ] **Step 9: Criar migration — Functions**

Criar `supabase/migrations/00009_wa_functions.sql`:
```sql
-- Busca vetorial na knowledge base
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

- [ ] **Step 10: Aplicar migrations no Supabase**

Abrir o Supabase SQL Editor do projeto `crm-seguros` e executar cada arquivo de migration em ordem (00001 → 00009).

OU usar Supabase CLI (se instalado):
```bash
# Copiar URL e service role do .env.local do crm-seguros
supabase db push --db-url "postgresql://postgres:[senha]@[host]:5432/postgres"
```

Expected: todas as tabelas `wa_*` criadas sem erros. Verificar no Supabase Table Editor que as 12 tabelas existem.

- [ ] **Step 11: Verificar tabelas no Supabase**

No SQL Editor do Supabase, rodar:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'wa_%'
ORDER BY table_name;
```

Expected: 12 linhas:
```
wa_agents
wa_contacts
wa_conversation_notes
wa_conversations
wa_evolution_instances
wa_knowledge_chunks
wa_knowledge_documents
wa_knowledge_faqs
wa_messages
wa_organization_members
wa_organizations
wa_provider_secrets
```

- [ ] **Step 12: Commit das migrations**

```bash
git add supabase/
git commit -m "feat: add supabase migrations for all wa_* tables with RLS and pgvector"
```

---

### Task 6: Docker Compose + Bootstrap dos Apps

**Files:**
- Create: `docker-compose.yml`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/Dockerfile`
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/src/index.ts`
- Create: `apps/worker/Dockerfile`
- Create: `apps/worker/healthcheck.js`

- [ ] **Step 1: Criar docker-compose.yml (dev local)**

Criar `docker-compose.yml`:
```yaml
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3001:3001"
    env_file: .env
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    env_file: .env
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  redis_data:
```

- [ ] **Step 2: Criar apps/api/package.json**

Criar `apps/api/package.json`:
```json
{
  "name": "@agente-crm/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "fastify": "^5.2.0",
    "@fastify/cors": "^11.0.0",
    "@fastify/multipart": "^9.0.0",
    "dotenv": "^16.4.0",
    "@agente-crm/shared": "workspace:*",
    "@agente-crm/database": "workspace:*",
    "@agente-crm/queue": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 3: Criar apps/api/tsconfig.json**

Criar `apps/api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Criar apps/api/src/server.ts (bootstrap mínimo)**

Criar `apps/api/src/server.ts`:
```typescript
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

const server = Fastify({ logger: true });

server.register(cors, { origin: true });

server.get("/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

const start = async () => {
  const port = parseInt(process.env.API_PORT || "3001", 10);
  await server.listen({ port, host: "0.0.0.0" });
  server.log.info(`API server running on port ${port}`);
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 5: Criar apps/api/Dockerfile**

Criar `apps/api/Dockerfile`:
```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/database/package.json packages/database/
COPY packages/queue/package.json packages/queue/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY apps/api/ apps/api/
RUN pnpm turbo build --filter=@agente-crm/api

WORKDIR /app/apps/api
RUN apk add --no-cache curl
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

- [ ] **Step 6: Criar apps/worker/package.json**

Criar `apps/worker/package.json`:
```json
{
  "name": "@agente-crm/worker",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "bullmq": "^5.30.0",
    "ioredis": "^5.4.0",
    "dotenv": "^16.4.0",
    "@agente-crm/shared": "workspace:*",
    "@agente-crm/database": "workspace:*",
    "@agente-crm/queue": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 7: Criar apps/worker/tsconfig.json**

Criar `apps/worker/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 8: Criar apps/worker/src/index.ts (bootstrap mínimo)**

Criar `apps/worker/src/index.ts`:
```typescript
import "dotenv/config";
import { getRedisConnection } from "@agente-crm/queue";

async function main() {
  const redis = getRedisConnection();
  redis.on("connect", () => console.log("[Worker] Connected to Redis"));
  redis.on("error", (err) => console.error("[Worker] Redis error:", err));
  console.log("[Worker] Started. Waiting for jobs...");

  const shutdown = async () => {
    console.log("[Worker] Shutting down...");
    await redis.quit();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("[Worker] Failed to start:", err);
  process.exit(1);
});
```

- [ ] **Step 9: Criar apps/worker/healthcheck.js**

Criar `apps/worker/healthcheck.js`:
```javascript
const net = require("net");
const client = net.createConnection({ host: "redis", port: 6379 }, () => {
  client.end();
  process.exit(0);
});
client.on("error", () => process.exit(1));
setTimeout(() => process.exit(1), 3000);
```

- [ ] **Step 10: Criar apps/worker/Dockerfile**

Criar `apps/worker/Dockerfile`:
```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/database/package.json packages/database/
COPY packages/queue/package.json packages/queue/
COPY apps/worker/package.json apps/worker/
RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY apps/worker/ apps/worker/
RUN pnpm turbo build --filter=@agente-crm/worker

WORKDIR /app/apps/worker
COPY apps/worker/healthcheck.js .
CMD ["node", "dist/index.js"]
```

- [ ] **Step 11: Instalar todas as dependências do monorepo**

```bash
pnpm install
```

Expected: sem erros, todos os packages instalados.

- [ ] **Step 12: Verificar typecheck de todo o monorepo**

```bash
pnpm typecheck
```

Expected: `Tasks: 4 successful, 4 total` (shared, database, queue, api, worker). Sem erros de tipo.

- [ ] **Step 13: Criar .env com credenciais reais para testar**

Copiar `.env.example` para `.env` e preencher com as credenciais do `crm-seguros`:
```bash
cp .env.example .env
```

Abrir `.env` e preencher:
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`: copiar do `crm-seguros/.env.local`
- `REDIS_URL`: `redis://localhost:6379` (local via Docker)
- `GOOGLE_AI_API_KEY`: sua chave do Google AI Studio

- [ ] **Step 14: Testar API server localmente**

```bash
pnpm dev:api
```

Em outro terminal:
```bash
curl http://localhost:3001/health
```

Expected:
```json
{"status":"ok","timestamp":"2026-..."}
```

- [ ] **Step 15: Commit final**

```bash
git add apps/ docker-compose.yml
git commit -m "feat: add docker-compose, api server bootstrap, and worker bootstrap"
```

---

### Task 7: Verificação Final da Fase 1

- [ ] **Step 1: Verificar estrutura completa**

```bash
find . -type f -not -path './node_modules/*' -not -path './.git/*' | sort
```

Expected: todos os arquivos das tasks 1-6 presentes.

- [ ] **Step 2: Typecheck completo**

```bash
pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 3: Testes do shared**

```bash
cd packages/shared && pnpm test
```

Expected: `3 passed`.

- [ ] **Step 4: Verificar que as tabelas wa_* existem no Supabase**

No Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'wa_%';
```

Expected: `12`

- [ ] **Step 5: Commit final se houver ajustes**

```bash
git status
# Se houver mudanças:
git add -A && git commit -m "chore: fase 1 final adjustments"
```
