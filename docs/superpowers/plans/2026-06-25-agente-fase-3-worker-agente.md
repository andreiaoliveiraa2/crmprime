# Fase 3: Worker & Agente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar os workers BullMQ em `apps/worker`: runner MPA (assistente executiva dos corretores via Gemini + RAG da knowledge base MPA), runner de atendimento (qualificação de leads + handoff humano), worker de envio de mensagens, e worker de processamento de documentos (chunking + embeddings Gemini).

**Architecture:** 4 workers processam 4 filas BullMQ. O `process-message` worker usa Redis SETNX para lock de conversa (evita resposta duplicada se duas mensagens chegarem juntas), identifica o runner (mpa ou client_attendance), e invoca o agente LLM via Vercel AI SDK. O Gemini `text-embedding-004` gera embeddings 768d para os chunks de documentos.

**Tech Stack:** BullMQ 5, ioredis 5, Vercel AI SDK (`ai`), `@ai-sdk/google` (Gemini), TypeScript 5, Vitest 3

## Global Constraints

- Pasta: `C:\Users\Andreia Ferreira\Desktop\agente-crm\apps\worker\`
- Pré-requisito: Fases 1 e 2 concluídas
- LLM: Gemini via `@ai-sdk/google`, modelo padrão `gemini-1.5-flash`
- Embeddings: `text-embedding-004` → `vector(768)` — NUNCA usar dimensão 1536
- Redis lock com TTL 60s para evitar processamento duplicado por conversa
- Worker usa `service_role` key do Supabase (bypassa RLS)
- Agente nunca responde se `is_human_takeover = true`
- Conteúdo dos 46 agentes MPA: importados como documentos na knowledge base via dashboard (Fase 5)
- Ao falhar LLM após 3 tentativas: marcar `status: 'waiting'` e não processar até humano retornar controle

---

### Task 1: Estrutura do Worker + Lock de Conversa

**Files:**
- Modify: `apps/worker/src/index.ts`
- Create: `apps/worker/src/lib/lock.ts`
- Create: `apps/worker/src/lib/supabase.ts`
- Create: `apps/worker/src/lib/evolution.ts`
- Test: `apps/worker/src/lib/lock.test.ts`

**Interfaces:**
- Produces: `acquireLock(conversationId)`, `releaseLock(conversationId)`, `evolutionSend(instanceName, phone, content)`

- [ ] **Step 1: Instalar dependências**

```bash
cd apps/worker
pnpm add ai @ai-sdk/google
```

- [ ] **Step 2: Criar lib/supabase.ts**

Criar `apps/worker/src/lib/supabase.ts`:
```typescript
import { getAdminClient } from "@agente-crm/database";

export const supabaseAdmin = getAdminClient();
```

- [ ] **Step 3: Criar lib/evolution.ts**

Criar `apps/worker/src/lib/evolution.ts`:
```typescript
export async function evolutionSend(instanceName: string, phone: string, content: string): Promise<void> {
  const baseUrl = process.env.EVOLUTION_API_URL!;
  const apiKey = process.env.EVOLUTION_API_KEY!;

  const res = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({ number: phone, text: content }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API error ${res.status}: ${err}`);
  }
}
```

- [ ] **Step 4: Escrever teste do lock**

Criar `apps/worker/src/lib/lock.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do ioredis
const mockSet = vi.fn();
const mockDel = vi.fn();
vi.mock("@agente-crm/queue", () => ({
  getRedisConnection: () => ({ set: mockSet, del: mockDel }),
}));

const { acquireLock, releaseLock } = await import("./lock.js");

describe("acquireLock", () => {
  beforeEach(() => {
    mockSet.mockReset();
    mockDel.mockReset();
  });

  it("retorna true quando lock é adquirido", async () => {
    mockSet.mockResolvedValue("OK");
    const result = await acquireLock("conv-123");
    expect(result).toBe(true);
    expect(mockSet).toHaveBeenCalledWith(
      "lock:conversation:conv-123",
      "1",
      "NX",
      "EX",
      60
    );
  });

  it("retorna false quando lock já existe", async () => {
    mockSet.mockResolvedValue(null);
    const result = await acquireLock("conv-123");
    expect(result).toBe(false);
  });
});

describe("releaseLock", () => {
  it("deleta a chave do lock", async () => {
    mockDel.mockResolvedValue(1);
    await releaseLock("conv-123");
    expect(mockDel).toHaveBeenCalledWith("lock:conversation:conv-123");
  });
});
```

- [ ] **Step 5: Rodar teste para ver falhar**

```bash
cd apps/worker && pnpm add -D vitest && pnpm test
```

Expected: `Error: Cannot find module './lock.js'`

- [ ] **Step 6: Criar lib/lock.ts**

Criar `apps/worker/src/lib/lock.ts`:
```typescript
import { getRedisConnection } from "@agente-crm/queue";

const LOCK_TTL_SECONDS = 60;

export async function acquireLock(conversationId: string): Promise<boolean> {
  const redis = getRedisConnection();
  const key = `lock:conversation:${conversationId}`;
  const result = await redis.set(key, "1", "NX", "EX", LOCK_TTL_SECONDS);
  return result === "OK";
}

export async function releaseLock(conversationId: string): Promise<void> {
  const redis = getRedisConnection();
  await redis.del(`lock:conversation:${conversationId}`);
}
```

- [ ] **Step 7: Rodar teste para ver passar**

```bash
pnpm test
```

Expected: `2 passed`

- [ ] **Step 8: Atualizar apps/worker/package.json com script de teste**

Editar `apps/worker/package.json`, adicionar `"test": "vitest run"` aos scripts.

- [ ] **Step 9: Commit**

```bash
cd ../..
git add apps/worker/
git commit -m "feat: add worker lib (lock, supabase admin, evolution sender)"
```

---

### Task 2: Runner MPA — Assistente Executiva dos Corretores

**Files:**
- Create: `apps/worker/src/runners/mpa.runner.ts`
- Create: `apps/worker/src/runners/mpa-system-prompt.ts`
- Test: `apps/worker/src/runners/mpa.runner.test.ts`

**Interfaces:**
- Consumes: `supabaseAdmin`, agente com `mode: 'mpa'`, mensagens da conversa, tools de RAG
- Produces: `runMpaAgent(params)` → string com resposta do agente

- [ ] **Step 1: Escrever teste do runner MPA**

Criar `apps/worker/src/runners/mpa.runner.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { buildMpaSystemPrompt } from "./mpa-system-prompt.js";
import type { WaAgent, WaMessage } from "@agente-crm/shared";

describe("buildMpaSystemPrompt", () => {
  it("inclui o system_prompt do agente", () => {
    const agent: Partial<WaAgent> = {
      name: "MPA",
      system_prompt: "Você é o MPA da Andreia.",
      mode: "mpa",
    };
    const prompt = buildMpaSystemPrompt(agent as WaAgent);
    expect(prompt).toContain("Você é o MPA da Andreia.");
  });

  it("inclui instrução de não inventar informações", () => {
    const agent: Partial<WaAgent> = {
      name: "MPA",
      system_prompt: "Você é o MPA.",
      mode: "mpa",
    };
    const prompt = buildMpaSystemPrompt(agent as WaAgent);
    expect(prompt).toContain("nunca invente");
  });
});
```

- [ ] **Step 2: Rodar teste para ver falhar**

```bash
pnpm test
```

Expected: `Error: Cannot find module './mpa-system-prompt.js'`

- [ ] **Step 3: Criar mpa-system-prompt.ts**

Criar `apps/worker/src/runners/mpa-system-prompt.ts`:
```typescript
import type { WaAgent } from "@agente-crm/shared";

export function buildMpaSystemPrompt(agent: WaAgent): string {
  return `${agent.system_prompt}

## Regras inegociáveis
- Nunca invente informações sobre planos, valores ou coberturas
- Nunca envie nada sem aprovação da corretora
- Sempre em português brasileiro coloquial e profissional
- Nunca pareça robótico — fale como uma sócia experiente
- Em caso de dúvida, pergunte em vez de inventar

## Contexto
Você está respondendo via WhatsApp. Seja direto e objetivo.
Respostas curtas e práticas — a corretora está ocupada.
Quando usar a base de conhecimento, cite a fonte quando relevante.`;
}
```

- [ ] **Step 4: Rodar teste para ver passar**

```bash
pnpm test
```

Expected: `2 passed`

- [ ] **Step 5: Criar mpa.runner.ts**

Criar `apps/worker/src/runners/mpa.runner.ts`:
```typescript
import { generateText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { WaAgent, WaMessage } from "@agente-crm/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { searchKnowledge, getFaqsByAgent } from "@agente-crm/database";
import { buildMpaSystemPrompt } from "./mpa-system-prompt.js";

function buildMessages(recentMessages: WaMessage[]) {
  return recentMessages.map((msg) => ({
    role: msg.role === "contact" ? ("user" as const) : ("assistant" as const),
    content: msg.content,
  }));
}

export async function runMpaAgent(params: {
  agent: WaAgent;
  recentMessages: WaMessage[];
  supabase: SupabaseClient;
  organizationId: string;
  apiKey: string;
}): Promise<string> {
  const { agent, recentMessages, supabase, organizationId, apiKey } = params;

  const systemPrompt = buildMpaSystemPrompt(agent);
  const messages = buildMessages(recentMessages);

  const modelId = agent.model || "gemini-1.5-flash";

  const { text } = await generateText({
    model: google(modelId, { apiKey }),
    system: systemPrompt,
    messages,
    temperature: agent.temperature,
    maxTokens: agent.max_tokens,
    tools: {
      searchKnowledge: tool({
        description:
          "Busca na base de conhecimento (agentes MPA, documentos, manuais) para responder com precisão. Use quando precisar de informações específicas sobre procedimentos, operadoras, ou scripts.",
        parameters: z.object({
          query: z.string().describe("Termo ou pergunta para buscar na knowledge base"),
        }),
        execute: async ({ query }) => {
          try {
            const { embedText } = await import("../lib/embeddings.js");
            const embedding = await embedText(query, apiKey);
            const results = await searchKnowledge(supabase, organizationId, agent.id, embedding, 3);
            if (results.length === 0) return "Nenhum resultado encontrado na base de conhecimento.";
            return results.map((r) => r.content).join("\n\n---\n\n");
          } catch {
            return "Erro ao buscar na base de conhecimento.";
          }
        },
      }),

      searchFaq: tool({
        description: "Busca nas perguntas frequentes cadastradas para resposta rápida e padronizada.",
        parameters: z.object({
          query: z.string().describe("Pergunta do usuário"),
        }),
        execute: async ({ query }) => {
          const faqs = await getFaqsByAgent(supabase, agent.id);
          if (faqs.length === 0) return "Nenhuma FAQ cadastrada.";
          // Retorna as primeiras 5 FAQs relevantes (busca simples por texto)
          const lower = query.toLowerCase();
          const relevant = faqs
            .filter((f) => f.question.toLowerCase().includes(lower) || lower.includes(f.question.toLowerCase().slice(0, 20)))
            .slice(0, 5);
          if (relevant.length === 0) return faqs.slice(0, 3).map((f) => `P: ${f.question}\nR: ${f.answer}`).join("\n\n");
          return relevant.map((f) => `P: ${f.question}\nR: ${f.answer}`).join("\n\n");
        },
      }),
    },
    maxSteps: 3,
  });

  return text;
}
```

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/worker/src/runners/
git commit -m "feat: add MPA agent runner with Gemini and knowledge base tools"
```

---

### Task 3: Runner de Atendimento — Qualificação de Leads

**Files:**
- Create: `apps/worker/src/runners/attendance.runner.ts`
- Create: `apps/worker/src/runners/attendance-system-prompt.ts`
- Test: `apps/worker/src/runners/attendance.runner.test.ts`

**Interfaces:**
- Consumes: agente com `mode: 'client_attendance'`, mensagens da conversa, ferramenta `createLead`
- Produces: `runAttendanceAgent(params)` → string com resposta

- [ ] **Step 1: Criar attendance-system-prompt.ts**

Criar `apps/worker/src/runners/attendance-system-prompt.ts`:
```typescript
import type { WaAgent } from "@agente-crm/shared";

export function buildAttendanceSystemPrompt(agent: WaAgent): string {
  return `${agent.system_prompt}

## Seu objetivo
Você é um assistente de atendimento ao cliente via WhatsApp.
Seu objetivo é qualificar leads: entender a necessidade, coletar nome e interesse, 
e registrar o lead para que um corretor possa dar continuidade.

## Fluxo de atendimento
1. Cumprimente e pergunte o nome
2. Entenda a necessidade (qual produto de saúde/seguro interessa)
3. Colete informações básicas (número de dependentes se for plano familiar)
4. Registre o lead com a ferramenta createLead
5. Informe que um especialista entrará em contato em breve

## Regras
- Nunca faça cotação ou prometa valores
- Sempre em português brasileiro
- Tom acolhedor e profissional
- Respostas curtas e diretas
- Se a pessoa quiser falar com humano, informe que vai transferir`;
}
```

- [ ] **Step 2: Escrever teste**

Criar `apps/worker/src/runners/attendance.runner.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { buildAttendanceSystemPrompt } from "./attendance-system-prompt.js";
import type { WaAgent } from "@agente-crm/shared";

describe("buildAttendanceSystemPrompt", () => {
  it("inclui o system_prompt do agente", () => {
    const agent = { system_prompt: "Atenda clientes da Andreia Corretora.", mode: "client_attendance" } as WaAgent;
    const prompt = buildAttendanceSystemPrompt(agent);
    expect(prompt).toContain("Atenda clientes da Andreia Corretora.");
  });

  it("contém instrução de criar lead", () => {
    const agent = { system_prompt: "...", mode: "client_attendance" } as WaAgent;
    const prompt = buildAttendanceSystemPrompt(agent);
    expect(prompt).toContain("createLead");
  });
});
```

- [ ] **Step 3: Rodar testes**

```bash
cd apps/worker && pnpm test
```

Expected: `4 passed`

- [ ] **Step 4: Criar attendance.runner.ts**

Criar `apps/worker/src/runners/attendance.runner.ts`:
```typescript
import { generateText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { WaAgent, WaMessage } from "@agente-crm/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { searchKnowledge, getFaqsByAgent } from "@agente-crm/database";
import { buildAttendanceSystemPrompt } from "./attendance-system-prompt.js";

export async function runAttendanceAgent(params: {
  agent: WaAgent;
  recentMessages: WaMessage[];
  contactId: string;
  conversationId: string;
  supabase: SupabaseClient;
  organizationId: string;
  apiKey: string;
}): Promise<string> {
  const { agent, recentMessages, contactId, conversationId, supabase, organizationId, apiKey } = params;

  const systemPrompt = buildAttendanceSystemPrompt(agent);
  const messages = recentMessages.map((msg) => ({
    role: msg.role === "contact" ? ("user" as const) : ("assistant" as const),
    content: msg.content,
  }));

  const modelId = agent.model || "gemini-1.5-flash";

  const { text } = await generateText({
    model: google(modelId, { apiKey }),
    system: systemPrompt,
    messages,
    temperature: agent.temperature,
    maxTokens: agent.max_tokens,
    tools: {
      createLead: tool({
        description:
          "Cria um lead no CRM quando a pessoa demonstrou interesse e forneceu nome. Chame assim que tiver nome + interesse.",
        parameters: z.object({
          nome: z.string().describe("Nome completo do cliente"),
          interesse: z.string().describe("Produto de interesse: plano de saúde individual, familiar, empresarial, etc."),
          observacoes: z.string().optional().describe("Outras informações relevantes"),
        }),
        execute: async ({ nome, interesse, observacoes }) => {
          try {
            // Criar lead na tabela `leads` existente do crm-seguros
            const { data, error } = await supabase
              .from("leads")
              .insert({
                nome,
                interesse,
                observacoes: observacoes || "",
                status: "novo",
                origem: "whatsapp",
              })
              .select("id")
              .single();

            if (error) throw error;

            // Vincular lead ao contato do WhatsApp
            await supabase.from("wa_contacts").update({ lead_id: data.id }).eq("id", contactId);

            return `Lead criado com sucesso! ID: ${data.id}`;
          } catch (err) {
            return "Não consegui registrar o lead. Um especialista irá atendê-lo em breve.";
          }
        },
      }),

      requestHumanHandoff: tool({
        description: "Solicita handoff para atendente humano quando cliente pede para falar com pessoa.",
        parameters: z.object({
          reason: z.string().describe("Motivo do handoff"),
        }),
        execute: async ({ reason }) => {
          await supabase.from("wa_conversations").update({
            is_human_takeover: true,
            human_takeover_at: new Date().toISOString(),
            status: "waiting",
          }).eq("id", conversationId);
          return "Handoff solicitado para atendente humano.";
        },
      }),

      searchFaq: tool({
        description: "Busca resposta nas perguntas frequentes sobre os produtos.",
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          const faqs = await getFaqsByAgent(supabase, agent.id);
          const lower = query.toLowerCase();
          const relevant = faqs.filter((f) => f.question.toLowerCase().includes(lower)).slice(0, 3);
          if (relevant.length === 0) return "Sem FAQ relevante.";
          return relevant.map((f) => `P: ${f.question}\nR: ${f.answer}`).join("\n\n");
        },
      }),
    },
    maxSteps: 3,
  });

  return text;
}
```

- [ ] **Step 5: Commit**

```bash
cd ../..
git add apps/worker/src/runners/
git commit -m "feat: add client attendance runner with lead creation and handoff tools"
```

---

### Task 4: Embeddings e Processamento de Documentos

**Files:**
- Create: `apps/worker/src/lib/embeddings.ts`
- Create: `apps/worker/src/lib/chunker.ts`
- Create: `apps/worker/src/workers/process-document.worker.ts`
- Test: `apps/worker/src/lib/chunker.test.ts`

**Interfaces:**
- Consumes: conteúdo do documento (texto), `GOOGLE_AI_API_KEY`
- Produces: `embedText(text, apiKey)` → `number[]` (768d), `chunkText(text, maxChunkSize)` → `string[]`

- [ ] **Step 1: Escrever teste do chunker**

Criar `apps/worker/src/lib/chunker.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { chunkText } from "./chunker.js";

describe("chunkText", () => {
  it("retorna chunk único para texto curto", () => {
    const text = "Texto curto.";
    const chunks = chunkText(text, 500);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("Texto curto.");
  });

  it("divide texto longo em chunks com overlap", () => {
    const text = "a".repeat(2000);
    const chunks = chunkText(text, 500);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(600); // margem de overlap
    });
  });

  it("não cria chunks vazios", () => {
    const text = "\n\n\n  \n\n";
    const chunks = chunkText(text, 500);
    chunks.forEach((chunk) => {
      expect(chunk.trim().length).toBeGreaterThan(0);
    });
  });

  it("divide por parágrafo quando possível", () => {
    const text = "Parágrafo 1.\n\nParágrafo 2.\n\nParágrafo 3.";
    const chunks = chunkText(text, 30);
    expect(chunks.length).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
cd apps/worker && pnpm test
```

Expected: `Error: Cannot find module './chunker.js'`

- [ ] **Step 3: Criar lib/chunker.ts**

Criar `apps/worker/src/lib/chunker.ts`:
```typescript
export function chunkText(text: string, maxChunkSize = 1000, overlap = 100): string[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChunkSize) {
      // Parágrafo muito longo: divide por sentença
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChunkSize) {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? " " : "") + sentence;
        }
      }
    } else if ((currentChunk + "\n\n" + paragraph).length > maxChunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());

  return chunks.filter((c) => c.trim().length > 0);
}
```

- [ ] **Step 4: Rodar testes para ver passar**

```bash
pnpm test
```

Expected: `6 passed` (chunker tests + lock tests + runner tests)

- [ ] **Step 5: Criar lib/embeddings.ts**

Criar `apps/worker/src/lib/embeddings.ts`:
```typescript
export async function embedText(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini Embeddings error ${res.status}: ${err}`);
  }

  const data = await res.json() as { embedding: { values: number[] } };
  const values = data.embedding.values;

  if (values.length !== 768) {
    throw new Error(`Expected 768 dimensions, got ${values.length}`);
  }

  return values;
}

export async function embedBatch(texts: string[], apiKey: string): Promise<number[][]> {
  // Gemini API não tem batch embedding; processar sequencialmente com delay
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedText(text, apiKey));
    await new Promise((resolve) => setTimeout(resolve, 100)); // rate limit
  }
  return results;
}
```

- [ ] **Step 6: Criar process-document.worker.ts**

Criar `apps/worker/src/workers/process-document.worker.ts`:
```typescript
import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@agente-crm/shared";
import { getRedisConnection, type ProcessDocumentJobData } from "@agente-crm/queue";
import { supabaseAdmin } from "../lib/supabase.js";
import { insertChunks, updateDocument } from "@agente-crm/database";
import { chunkText } from "../lib/chunker.js";
import { embedBatch } from "../lib/embeddings.js";

export function createProcessDocumentWorker() {
  return new Worker<ProcessDocumentJobData>(
    QUEUE_NAMES.PROCESS_DOCUMENT,
    async (job) => {
      const { documentId, organizationId, agentId } = job.data;

      // Buscar documento
      const { data: doc, error } = await supabaseAdmin
        .from("wa_knowledge_documents")
        .select("*")
        .eq("id", documentId)
        .single();
      if (error || !doc) throw new Error(`Document ${documentId} not found`);

      // Baixar arquivo do Supabase Storage
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from("wa-knowledge")
        .download(new URL(doc.file_url).pathname.split("/wa-knowledge/")[1]);
      if (downloadError || !fileData) throw new Error(`Failed to download document: ${downloadError?.message}`);

      // Extrair texto (suporte básico a .md, .txt — PDF requer biblioteca extra)
      let text = "";
      if (doc.file_type === "md" || doc.file_type === "txt") {
        text = await fileData.text();
      } else if (doc.file_type === "csv") {
        text = await fileData.text();
      } else {
        // Para PDF e DOCX: usar texto bruto (Phase 3 não inclui parser de PDF)
        text = await fileData.text();
      }

      if (!text.trim()) {
        await updateDocument(supabaseAdmin, documentId, { status: "error", error_message: "Empty document content" });
        return;
      }

      // Dividir em chunks
      const chunks = chunkText(text, 1000, 100);

      // Gerar embeddings
      const apiKey = process.env.GOOGLE_AI_API_KEY!;
      const embeddings = await embedBatch(chunks, apiKey);

      // Deletar chunks antigos (reprocessamento)
      await supabaseAdmin.from("wa_knowledge_chunks").delete().eq("document_id", documentId);

      // Inserir novos chunks com embeddings
      await insertChunks(
        supabaseAdmin,
        chunks.map((content, idx) => ({
          document_id: documentId,
          organization_id: organizationId,
          content,
          metadata: { chunk_index: idx, document_title: doc.title, file_name: doc.file_name },
          embedding: embeddings[idx],
          chunk_index: idx,
        }))
      );

      // Atualizar status do documento
      await updateDocument(supabaseAdmin, documentId, {
        status: "ready",
        chunk_count: chunks.length,
      });

      console.log(`[ProcessDocument] Document ${documentId} processed: ${chunks.length} chunks`);
    },
    {
      connection: getRedisConnection(),
      concurrency: 2,
    }
  );
}
```

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/worker/
git commit -m "feat: add embeddings, chunker, and document processing worker"
```

---

### Task 5: Worker Principal — `process-message`

**Files:**
- Create: `apps/worker/src/workers/process-message.worker.ts`
- Modify: `apps/worker/src/index.ts`

**Interfaces:**
- Consumes: `ProcessMessageJobData`, `runMpaAgent`, `runAttendanceAgent`, `acquireLock`, `releaseLock`
- Produces: worker que processa mensagens, chama LLM, salva resposta, enfileira envio

- [ ] **Step 1: Criar process-message.worker.ts**

Criar `apps/worker/src/workers/process-message.worker.ts`:
```typescript
import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@agente-crm/shared";
import { getRedisConnection, getSendMessageQueue, type ProcessMessageJobData } from "@agente-crm/queue";
import { supabaseAdmin } from "../lib/supabase.js";
import { acquireLock, releaseLock } from "../lib/lock.js";
import {
  getAgentById,
  getRecentMessages,
  createMessage,
  updateConversation,
  getInstanceByInstanceId,
  getContactByPhone,
} from "@agente-crm/database";
import { runMpaAgent } from "../runners/mpa.runner.js";
import { runAttendanceAgent } from "../runners/attendance.runner.js";

export function createProcessMessageWorker() {
  return new Worker<ProcessMessageJobData>(
    QUEUE_NAMES.PROCESS_MESSAGE,
    async (job) => {
      const { conversationId, messageId, agentId, organizationId, mode } = job.data;

      // 1. Lock de conversa
      const acquired = await acquireLock(conversationId);
      if (!acquired) {
        console.log(`[ProcessMessage] Conversation ${conversationId} locked, requeueing...`);
        await new Promise((r) => setTimeout(r, 2000));
        throw new Error("Conversation locked — will retry");
      }

      try {
        // 2. Checar se conversa ainda está disponível para bot
        const { data: conversation } = await supabaseAdmin
          .from("wa_conversations")
          .select("*, wa_evolution_instances(instance_name), wa_contacts(phone)")
          .eq("id", conversationId)
          .single();

        if (!conversation || conversation.is_human_takeover) {
          console.log(`[ProcessMessage] Conversation ${conversationId} in human takeover, skipping`);
          return;
        }

        // 3. Buscar agente
        const agent = await getAgentById(supabaseAdmin, agentId);
        if (!agent.is_active) return;

        // 4. Buscar chave de API da organização (ou usar variável de ambiente)
        let apiKey = process.env.GOOGLE_AI_API_KEY!;
        const { data: secret } = await supabaseAdmin
          .from("wa_provider_secrets")
          .select("encrypted_key")
          .eq("organization_id", organizationId)
          .eq("provider", agent.provider)
          .maybeSingle();
        if (secret?.encrypted_key) apiKey = secret.encrypted_key; // sem criptografia na fase 3

        // 5. Buscar mensagens recentes para contexto
        const recentMessages = await getRecentMessages(supabaseAdmin, conversationId, 20);

        // 6. Invocar runner correto
        let responseText: string;
        if (mode === "mpa") {
          responseText = await runMpaAgent({
            agent,
            recentMessages,
            supabase: supabaseAdmin,
            organizationId,
            apiKey,
          });
        } else {
          const contact = conversation.wa_contacts;
          responseText = await runAttendanceAgent({
            agent,
            recentMessages,
            contactId: contact.id,
            conversationId,
            supabase: supabaseAdmin,
            organizationId,
            apiKey,
          });
        }

        // 7. Salvar mensagem do agente
        const agentMessage = await createMessage(supabaseAdmin, {
          conversation_id: conversationId,
          organization_id: organizationId,
          evolution_message_id: null,
          role: "agent",
          content: responseText,
          media_url: null,
          media_type: "text",
          metadata: { model: agent.model },
        });

        await updateConversation(supabaseAdmin, conversationId, {
          last_message_at: new Date().toISOString(),
        });

        // 8. Enfileirar envio
        const sendQueue = getSendMessageQueue();
        const instance = conversation.wa_evolution_instances;
        const contact = conversation.wa_contacts;

        await sendQueue.add("send-message", {
          conversationId,
          messageId: agentMessage.id,
          instanceId: instance.instance_name,
          phone: contact.phone,
          content: responseText,
          organizationId,
        });

        console.log(`[ProcessMessage] Conversation ${conversationId} processed (mode: ${mode})`);
      } finally {
        await releaseLock(conversationId);
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    }
  );
}
```

- [ ] **Step 2: Criar send-message.worker.ts**

Criar `apps/worker/src/workers/send-message.worker.ts`:
```typescript
import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@agente-crm/shared";
import { getRedisConnection, type SendMessageJobData } from "@agente-crm/queue";
import { evolutionSend } from "../lib/evolution.js";

export function createSendMessageWorker() {
  return new Worker<SendMessageJobData>(
    QUEUE_NAMES.SEND_MESSAGE,
    async (job) => {
      const { instanceId, phone, content } = job.data;
      await evolutionSend(instanceId, phone, content);
      console.log(`[SendMessage] Sent to ${phone} via ${instanceId}`);
    },
    {
      connection: getRedisConnection(),
      concurrency: 10,
    }
  );
}
```

- [ ] **Step 3: Atualizar apps/worker/src/index.ts**

Substituir `apps/worker/src/index.ts`:
```typescript
import "dotenv/config";
import { getRedisConnection } from "@agente-crm/queue";
import { createProcessMessageWorker } from "./workers/process-message.worker.js";
import { createSendMessageWorker } from "./workers/send-message.worker.js";
import { createProcessDocumentWorker } from "./workers/process-document.worker.js";

async function main() {
  const redis = getRedisConnection();
  redis.on("connect", () => console.log("[Worker] Connected to Redis"));
  redis.on("error", (err) => console.error("[Worker] Redis error:", err));

  const processMessageWorker = createProcessMessageWorker();
  const sendMessageWorker = createSendMessageWorker();
  const processDocumentWorker = createProcessDocumentWorker();

  processMessageWorker.on("failed", (job, err) => {
    console.error(`[ProcessMessage] Job ${job?.id} failed:`, err.message);
  });
  sendMessageWorker.on("failed", (job, err) => {
    console.error(`[SendMessage] Job ${job?.id} failed:`, err.message);
  });
  processDocumentWorker.on("failed", (job, err) => {
    console.error(`[ProcessDocument] Job ${job?.id} failed:`, err.message);
  });

  console.log("[Worker] All workers started. Processing jobs...");

  const shutdown = async () => {
    console.log("[Worker] Shutting down...");
    await Promise.all([
      processMessageWorker.close(),
      sendMessageWorker.close(),
      processDocumentWorker.close(),
    ]);
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

- [ ] **Step 4: Verificar typecheck**

```bash
cd apps/worker && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
cd ../..
git add apps/worker/
git commit -m "feat: add process-message and send-message workers with full LLM integration"
```

---

### Task 6: Teste de Integração do Fluxo Completo

**Objetivo:** Verificar o fluxo end-to-end: webhook recebe mensagem → API enfileira → worker processa → Evolution envia.

**Pré-requisito:** Redis rodando localmente (`docker compose up redis -d`).

- [ ] **Step 1: Iniciar Redis via Docker**

```bash
docker compose up redis -d
```

Expected: container `agente-crm-redis-1` rodando.

- [ ] **Step 2: Iniciar API e Worker em terminais separados**

Terminal 1:
```bash
pnpm dev:api
```

Terminal 2:
```bash
pnpm dev:worker
```

Expected: ambos iniciam sem erros. Worker exibe `[Worker] All workers started. Processing jobs...`

- [ ] **Step 3: Criar dados de teste no Supabase**

No Supabase SQL Editor:
```sql
-- 1. Criar organização de teste
INSERT INTO wa_organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Corretora Teste')
ON CONFLICT DO NOTHING;

-- 2. Criar agente MPA
INSERT INTO wa_agents (id, organization_id, name, system_prompt, mode, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'MPA Teste',
  'Você é o assistente da Andreia. Responda de forma útil e direta.',
  'mpa',
  true
) ON CONFLICT DO NOTHING;

-- 3. Criar instância Evolution
INSERT INTO wa_evolution_instances (id, organization_id, instance_name, instance_id, status, active_agent_id)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'instancia-teste',
  'instancia-teste',
  'connected',
  '00000000-0000-0000-0000-000000000002'
) ON CONFLICT DO NOTHING;

-- 4. Registrar telefone de corretor
INSERT INTO wa_organization_members (organization_id, user_id, role, whatsapp_phone)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  id,
  'owner',
  '5511999990001'
FROM auth.users LIMIT 1
ON CONFLICT DO NOTHING;
```

- [ ] **Step 4: Enviar webhook de teste**

```bash
curl -X POST http://localhost:3001/webhooks/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "instancia-teste",
    "data": {
      "key": { "remoteJid": "5511999990001@s.whatsapp.net", "fromMe": false, "id": "MSG-TESTE-001" },
      "messageType": "conversation",
      "message": { "conversation": "bom dia, o que temos hoje?" },
      "pushName": "Andreia"
    }
  }'
```

Expected: `{"ok":true}`

- [ ] **Step 5: Verificar processamento**

Verificar no Supabase:
```sql
-- Deve ter 2 mensagens: 1 contact + 1 agent
SELECT role, content FROM wa_messages ORDER BY created_at DESC LIMIT 5;
```

Expected: role `contact` com "bom dia..." e role `agent` com resposta do Gemini.

No terminal do worker: `[ProcessMessage] Conversation ... processed (mode: mpa)`

**Nota:** A mensagem do agente será enfileirada para envio mas falhará se a Evolution API não estiver rodando — isso é esperado nesta fase.

- [ ] **Step 6: Verificar todos os testes**

```bash
pnpm test
```

Expected: todos os testes passam.

- [ ] **Step 7: Commit final**

```bash
git status
git add -A && git commit -m "chore: fase 3 complete — workers with LLM runners and document processing"
```
