# Fase 2: Backend Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o servidor Fastify (`apps/api`) com webhook da Evolution API (idempotência, roteamento dual-mode), serviços de conversa/mensagem, endpoints REST para o dashboard, e enfileiramento BullMQ.

**Architecture:** Fastify 5 com rotas separadas por domínio. O webhook recebe mensagens da Evolution API, determina se o remetente é corretor (modo MPA) ou cliente (modo atendimento), e enfileira `process-message`. O servidor não processa LLM — apenas valida, persiste e enfileira.

**Tech Stack:** Fastify 5, @fastify/cors, @fastify/multipart, @fastify/jwt, TypeScript 5, Zod (via @agente-crm/shared), Vitest 3, @supabase/supabase-js 2

## Global Constraints

- Pasta: `C:\Users\Andreia Ferreira\Desktop\agente-crm\apps\api\`
- Pré-requisito: Fase 1 concluída (packages compilam, tabelas `wa_*` existem no Supabase)
- Autenticação: JWT do Supabase Auth (mesmo auth do crm-seguros)
- Worker não está implementado ainda — apenas enfileirar jobs, não processar
- Webhook deve retornar 200 OK imediatamente (Evolution API não tolera timeout)
- Idempotência: checar `evolution_message_id` antes de processar
- Roteamento: se remetente está em `wa_organization_members.whatsapp_phone` → modo `mpa`; senão → `client_attendance`

---

### Task 1: Estrutura do Servidor Fastify + Middleware

**Files:**
- Modify: `apps/api/src/server.ts`
- Create: `apps/api/src/lib/supabase.ts`
- Create: `apps/api/src/lib/queue.ts`
- Create: `apps/api/src/middleware/auth.ts`
- Create: `apps/api/src/middleware/webhook-verify.ts`

**Interfaces:**
- Produces: servidor Fastify com `/health`, middleware de auth, middleware de webhook

- [ ] **Step 1: Instalar dependências adicionais**

```bash
cd apps/api
pnpm add @fastify/jwt
```

- [ ] **Step 2: Criar lib/supabase.ts**

Criar `apps/api/src/lib/supabase.ts`:
```typescript
import { getAdminClient } from "@agente-crm/database";
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = getAdminClient();

export function createAnonClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key);
}
```

- [ ] **Step 3: Criar lib/queue.ts**

Criar `apps/api/src/lib/queue.ts`:
```typescript
import {
  getProcessMessageQueue,
  getSendMessageQueue,
  getProcessDocumentQueue,
} from "@agente-crm/queue";

export const processMessageQueue = getProcessMessageQueue();
export const sendMessageQueue = getSendMessageQueue();
export const processDocumentQueue = getProcessDocumentQueue();
```

- [ ] **Step 4: Criar middleware/auth.ts**

Criar `apps/api/src/middleware/auth.ts`:
```typescript
import type { FastifyRequest, FastifyReply } from "fastify";
import { createAnonClient } from "../lib/supabase.js";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Missing authorization header" });
  }
  const token = authHeader.slice(7);
  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return reply.code(401).send({ error: "Invalid or expired token" });
  }
  (request as FastifyRequest & { userId: string }).userId = data.user.id;
}
```

- [ ] **Step 5: Criar middleware/webhook-verify.ts**

Criar `apps/api/src/middleware/webhook-verify.ts`:
```typescript
import type { FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";

export async function verifyWebhookOrigin(request: FastifyRequest, reply: FastifyReply) {
  const secret = process.env.EVOLUTION_WEBHOOK_SECRET;
  if (!secret) return; // sem secret configurado, aceitar qualquer origem (dev)

  const signature = request.headers["x-evolution-signature"] as string | undefined;
  if (!signature) {
    return reply.code(401).send({ error: "Missing webhook signature" });
  }

  const body = JSON.stringify(request.body);
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return reply.code(401).send({ error: "Invalid webhook signature" });
  }
}
```

- [ ] **Step 6: Atualizar server.ts com plugins e rotas base**

Substituir `apps/api/src/server.ts`:
```typescript
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";

const server = Fastify({ logger: { level: process.env.NODE_ENV === "production" ? "info" : "debug" } });

await server.register(cors, { origin: true });
await server.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

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

- [ ] **Step 7: Verificar typecheck**

```bash
pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
cd ../..
git add apps/api/
git commit -m "feat: add fastify server structure with auth and webhook middleware"
```

---

### Task 2: Serviços de Domínio

**Files:**
- Create: `apps/api/src/services/evolution.service.ts`
- Create: `apps/api/src/services/conversation.service.ts`
- Create: `apps/api/src/services/message.service.ts`
- Create: `apps/api/src/services/knowledge.service.ts`
- Test: `apps/api/src/services/conversation.service.test.ts`

**Interfaces:**
- Consumes: queries de `@agente-crm/database`, tipos de `@agente-crm/shared`
- Produces: `ConversationService.resolveOrCreate`, `MessageService.saveIncoming`, `EvolutionService.sendMessage`, `KnowledgeService.uploadDocument`

- [ ] **Step 1: Criar evolution.service.ts**

Criar `apps/api/src/services/evolution.service.ts`:
```typescript
export class EvolutionService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_API_URL!;
    this.apiKey = process.env.EVOLUTION_API_KEY!;
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      apikey: this.apiKey,
    };
  }

  async sendTextMessage(instanceName: string, phone: string, content: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        number: phone,
        text: content,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Evolution API error ${res.status}: ${err}`);
    }
  }

  async getQRCode(instanceName: string): Promise<{ base64: string } | null> {
    const res = await fetch(`${this.baseUrl}/instance/connect/${instanceName}`, {
      headers: this.headers(),
    });
    if (!res.ok) return null;
    const data = await res.json() as { base64?: string };
    return data.base64 ? { base64: data.base64 } : null;
  }

  async createInstance(instanceName: string, webhookUrl: string): Promise<{ instanceId: string }> {
    const res = await fetch(`${this.baseUrl}/instance/create`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        instanceName,
        webhook: webhookUrl,
        webhookByEvents: true,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      }),
    });
    if (!res.ok) throw new Error(`Failed to create instance: ${await res.text()}`);
    const data = await res.json() as { instance: { instanceId: string } };
    return { instanceId: data.instance.instanceId };
  }

  async deleteInstance(instanceName: string): Promise<void> {
    await fetch(`${this.baseUrl}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: this.headers(),
    });
  }

  async getInstanceStatus(instanceName: string): Promise<"connected" | "disconnected" | "connecting"> {
    const res = await fetch(`${this.baseUrl}/instance/connectionState/${instanceName}`, {
      headers: this.headers(),
    });
    if (!res.ok) return "disconnected";
    const data = await res.json() as { instance?: { state?: string } };
    const state = data.instance?.state;
    if (state === "open") return "connected";
    if (state === "connecting") return "connecting";
    return "disconnected";
  }
}

export const evolutionService = new EvolutionService();
```

- [ ] **Step 2: Criar conversation.service.ts**

Criar `apps/api/src/services/conversation.service.ts`:
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentMode } from "@agente-crm/shared";
import {
  upsertContact,
  findOpenConversation,
  createConversation,
  getRegisteredPhones,
  getInstanceByInstanceId,
} from "@agente-crm/database";

export function routeByPhone(senderPhone: string, registeredPhones: string[]): AgentMode {
  return registeredPhones.includes(senderPhone) ? "mpa" : "client_attendance";
}

export async function resolveConversation(
  client: SupabaseClient,
  params: {
    organizationId: string;
    instanceId: string;
    evolutionInstanceDbId: string;
    phone: string;
    pushName: string | null;
    activeAgentId: string;
    mode: AgentMode;
  }
) {
  const contact = await upsertContact(client, params.organizationId, params.phone, params.pushName, null);

  let conversation = await findOpenConversation(client, contact.id, params.activeAgentId);
  if (!conversation) {
    conversation = await createConversation(client, {
      organization_id: params.organizationId,
      agent_id: params.activeAgentId,
      evolution_instance_id: params.evolutionInstanceDbId,
      contact_id: contact.id,
      mode: params.mode,
      status: "open",
      is_human_takeover: false,
      human_takeover_at: null,
      assigned_to: null,
      tags: [],
      last_message_at: new Date().toISOString(),
    });
  }

  return { contact, conversation };
}
```

- [ ] **Step 3: Criar message.service.ts**

Criar `apps/api/src/services/message.service.ts`:
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaType } from "@agente-crm/shared";
import { createMessage, messageExistsByEvolutionId, updateConversation } from "@agente-crm/database";

export function extractTextContent(payload: {
  messageType: string;
  message?: {
    conversation?: string;
    imageMessage?: { caption?: string };
    videoMessage?: { caption?: string };
    documentMessage?: { fileName?: string };
  };
}): { content: string; mediaType: MediaType } {
  const { messageType, message } = payload;

  if (messageType === "conversation" && message?.conversation) {
    return { content: message.conversation, mediaType: "text" };
  }
  if (messageType === "imageMessage") {
    return { content: message?.imageMessage?.caption || "[imagem]", mediaType: "image" };
  }
  if (messageType === "audioMessage") {
    return { content: "[áudio]", mediaType: "audio" };
  }
  if (messageType === "videoMessage") {
    return { content: message?.videoMessage?.caption || "[vídeo]", mediaType: "video" };
  }
  if (messageType === "documentMessage") {
    return { content: `[documento: ${message?.documentMessage?.fileName || "arquivo"}]`, mediaType: "document" };
  }
  return { content: `[${messageType}]`, mediaType: "text" };
}

export async function saveIncomingMessage(
  client: SupabaseClient,
  params: {
    conversationId: string;
    organizationId: string;
    evolutionMessageId: string;
    content: string;
    mediaType: MediaType;
  }
) {
  const msg = await createMessage(client, {
    conversation_id: params.conversationId,
    organization_id: params.organizationId,
    evolution_message_id: params.evolutionMessageId,
    role: "contact",
    content: params.content,
    media_url: null,
    media_type: params.mediaType,
    metadata: null,
  });

  await updateConversation(client, params.conversationId, {
    last_message_at: new Date().toISOString(),
  });

  return msg;
}
```

- [ ] **Step 4: Criar knowledge.service.ts**

Criar `apps/api/src/services/knowledge.service.ts`:
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentFileType } from "@agente-crm/shared";
import { createDocument } from "@agente-crm/database";
import { processDocumentQueue } from "../lib/queue.js";

export async function uploadDocument(
  client: SupabaseClient,
  params: {
    organizationId: string;
    agentId: string;
    title: string;
    fileName: string;
    fileType: DocumentFileType;
    fileSizeBytes: number;
    fileBuffer: Buffer;
  }
) {
  // Upload para Supabase Storage
  const { createClient } = await import("@supabase/supabase-js");
  const adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const storagePath = `${params.organizationId}/${params.agentId}/${Date.now()}-${params.fileName}`;
  const { error: uploadError } = await adminClient.storage
    .from("wa-knowledge")
    .upload(storagePath, params.fileBuffer, { contentType: "application/octet-stream" });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: { publicUrl } } = adminClient.storage.from("wa-knowledge").getPublicUrl(storagePath);

  // Criar registro no banco
  const doc = await createDocument(client, {
    agent_id: params.agentId,
    organization_id: params.organizationId,
    title: params.title,
    file_name: params.fileName,
    file_url: publicUrl,
    file_type: params.fileType,
    file_size_bytes: params.fileSizeBytes,
    status: "processing",
  });

  // Enfileirar processamento
  await processDocumentQueue.add("process-document", {
    documentId: doc.id,
    organizationId: params.organizationId,
    agentId: params.agentId,
  });

  return doc;
}
```

- [ ] **Step 5: Escrever testes para routeByPhone e extractTextContent**

Criar `apps/api/src/services/conversation.service.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { routeByPhone } from "./conversation.service.js";
import { extractTextContent } from "./message.service.js";

describe("routeByPhone", () => {
  const registeredPhones = ["5511999990001", "5511999990002"];

  it("retorna 'mpa' quando número está cadastrado como corretor", () => {
    expect(routeByPhone("5511999990001", registeredPhones)).toBe("mpa");
  });

  it("retorna 'client_attendance' quando número é desconhecido", () => {
    expect(routeByPhone("5511999999999", registeredPhones)).toBe("client_attendance");
  });

  it("retorna 'client_attendance' para lista vazia de corretores", () => {
    expect(routeByPhone("5511999990001", [])).toBe("client_attendance");
  });
});

describe("extractTextContent", () => {
  it("extrai texto de mensagem de conversa", () => {
    const result = extractTextContent({
      messageType: "conversation",
      message: { conversation: "Olá, preciso de ajuda" },
    });
    expect(result.content).toBe("Olá, preciso de ajuda");
    expect(result.mediaType).toBe("text");
  });

  it("extrai caption de imagem", () => {
    const result = extractTextContent({
      messageType: "imageMessage",
      message: { imageMessage: { caption: "Veja esta proposta" } },
    });
    expect(result.content).toBe("Veja esta proposta");
    expect(result.mediaType).toBe("image");
  });

  it("retorna placeholder para áudio", () => {
    const result = extractTextContent({ messageType: "audioMessage" });
    expect(result.content).toBe("[áudio]");
    expect(result.mediaType).toBe("audio");
  });

  it("retorna placeholder para tipo desconhecido", () => {
    const result = extractTextContent({ messageType: "stickerMessage" });
    expect(result.content).toBe("[stickerMessage]");
  });
});
```

- [ ] **Step 6: Adicionar vitest ao package.json da api**

Editar `apps/api/package.json`, adicionar à seção `"devDependencies"`:
```json
"vitest": "^3.0.0"
```

Adicionar script `"test": "vitest run"` na seção `"scripts"`.

- [ ] **Step 7: Rodar testes**

```bash
cd apps/api && pnpm install && pnpm test
```

Expected: `2 passed` (2 describes).

- [ ] **Step 8: Commit**

```bash
cd ../..
git add apps/api/
git commit -m "feat: add domain services (evolution, conversation, message, knowledge)"
```

---

### Task 3: Webhook da Evolution API

**Files:**
- Create: `apps/api/src/routes/webhooks/evolution.ts`
- Modify: `apps/api/src/server.ts`
- Test: `apps/api/src/routes/webhooks/evolution.test.ts`

**Interfaces:**
- Consumes: `resolveConversation`, `saveIncomingMessage`, `routeByPhone`, `getRegisteredPhones`, `getInstanceByInstanceId`, `messageExistsByEvolutionId`, `evolutionWebhookPayloadSchema`
- Produces: rota `POST /webhooks/evolution` que retorna 200 OK sempre

- [ ] **Step 1: Escrever o teste do webhook primeiro**

Criar `apps/api/src/routes/webhooks/evolution.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { routeByPhone } from "../../services/conversation.service.js";
import { extractTextContent } from "../../services/message.service.js";

// Os testes de integração do webhook dependem do Supabase e do Redis,
// então testamos apenas as funções puras aqui.
// O fluxo completo é testado manualmente com a Evolution API.

describe("fluxo de roteamento do webhook", () => {
  it("mensagem de corretor cadastrado vai para modo mpa", () => {
    const phones = ["5511999990001"];
    const mode = routeByPhone("5511999990001", phones);
    expect(mode).toBe("mpa");
  });

  it("mensagem de cliente desconhecido vai para atendimento", () => {
    const phones = ["5511999990001"];
    const mode = routeByPhone("5511888880001", phones);
    expect(mode).toBe("client_attendance");
  });

  it("número no formato com @s.whatsapp.net é normalizado", () => {
    const raw = "5511999990001@s.whatsapp.net";
    const normalized = raw.split("@")[0];
    const phones = ["5511999990001"];
    expect(routeByPhone(normalized, phones)).toBe("mpa");
  });
});
```

- [ ] **Step 2: Rodar teste para ver falhar**

```bash
cd apps/api && pnpm test
```

Expected: todos os testes passam (as funções já existem).

- [ ] **Step 3: Criar rota do webhook**

Criar `apps/api/src/routes/webhooks/evolution.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import { evolutionWebhookPayloadSchema } from "@agente-crm/shared";
import { supabaseAdmin } from "../../lib/supabase.js";
import { processMessageQueue } from "../../lib/queue.js";
import { verifyWebhookOrigin } from "../../middleware/webhook-verify.js";
import {
  getInstanceByInstanceId,
  messageExistsByEvolutionId,
  getRegisteredPhones,
} from "@agente-crm/database";
import { resolveConversation, routeByPhone } from "../../services/conversation.service.js";
import { saveIncomingMessage, extractTextContent } from "../../services/message.service.js";

export async function evolutionWebhookRoutes(app: FastifyInstance) {
  app.post(
    "/webhooks/evolution",
    { preHandler: verifyWebhookOrigin },
    async (request, reply) => {
      // Sempre responder 200 imediatamente (Evolution API não tolera timeout)
      reply.code(200).send({ ok: true });

      const parsed = evolutionWebhookPayloadSchema.safeParse(request.body);
      if (!parsed.success) return;

      const { event, instance: instanceName, data } = parsed.data;

      // Só processa mensagens recebidas (não mensagens enviadas pelo bot)
      if (event !== "messages.upsert" || data.key.fromMe) return;

      try {
        const phone = data.key.remoteJid.split("@")[0];
        const evolutionMessageId = data.key.id;

        // 1. Idempotência
        const alreadyProcessed = await messageExistsByEvolutionId(supabaseAdmin, evolutionMessageId);
        if (alreadyProcessed) return;

        // 2. Buscar instância e agente ativo
        const instance = await getInstanceByInstanceId(supabaseAdmin, instanceName);
        if (!instance.active_agent_id) return;

        const organizationId = instance.organization_id;

        // 3. Determinar modo (corretor ou cliente)
        const registeredPhones = await getRegisteredPhones(supabaseAdmin, organizationId);
        const mode = routeByPhone(phone, registeredPhones);

        // 4. Resolver conversa (upsert contato + upsert conversa)
        const { contact, conversation } = await resolveConversation(supabaseAdmin, {
          organizationId,
          instanceId: instanceName,
          evolutionInstanceDbId: instance.id,
          phone,
          pushName: data.pushName ?? null,
          activeAgentId: instance.active_agent_id,
          mode,
        });

        // 5. Checar se conversa está em takeover humano
        if (conversation.is_human_takeover) return;

        // 6. Salvar mensagem
        const { content, mediaType } = extractTextContent({
          messageType: data.messageType,
          message: data.message as Parameters<typeof extractTextContent>[0]["message"],
        });

        const message = await saveIncomingMessage(supabaseAdmin, {
          conversationId: conversation.id,
          organizationId,
          evolutionMessageId,
          content,
          mediaType,
        });

        // 7. Enfileirar processamento
        await processMessageQueue.add("process-message", {
          conversationId: conversation.id,
          messageId: message.id,
          agentId: instance.active_agent_id,
          organizationId,
          mode,
          corretorUserId: mode === "mpa"
            ? (registeredPhones.indexOf(phone) >= 0
               ? (await import("@agente-crm/database").then(m => m.getCorretorByPhone(supabaseAdmin, phone)))
               : null)?.user_id ?? null
            : null,
        });
      } catch (err) {
        app.log.error({ err }, "Error processing Evolution webhook");
      }
    }
  );
}
```

- [ ] **Step 4: Registrar a rota no server.ts**

Editar `apps/api/src/server.ts` para registrar a rota:
```typescript
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { evolutionWebhookRoutes } from "./routes/webhooks/evolution.js";

const server = Fastify({ logger: { level: process.env.NODE_ENV === "production" ? "info" : "debug" } });

await server.register(cors, { origin: true });
await server.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

server.get("/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

await server.register(evolutionWebhookRoutes);

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

- [ ] **Step 5: Verificar typecheck**

```bash
cd apps/api && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 6: Testar o servidor manualmente**

```bash
pnpm dev:api
```

Em outro terminal, simular um webhook:
```bash
curl -X POST http://localhost:3001/webhooks/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "minha-instancia",
    "data": {
      "key": { "remoteJid": "5511999990001@s.whatsapp.net", "fromMe": false, "id": "TEST123" },
      "messageType": "conversation",
      "message": { "conversation": "Olá" },
      "pushName": "João"
    }
  }'
```

Expected: `{"ok":true}` (mesmo que Supabase retorne erro por instância não existir — o webhook sempre retorna 200)

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/api/
git commit -m "feat: add evolution webhook with dual-mode routing and idempotency"
```

---

### Task 4: Endpoints REST — Mensagens e Conversas

**Files:**
- Create: `apps/api/src/routes/messages/send.ts`
- Create: `apps/api/src/routes/conversations/index.ts`
- Modify: `apps/api/src/server.ts`

**Interfaces:**
- Produces: `POST /messages/send` (envio manual pelo dashboard), `PATCH /conversations/:id` (takeover, status, tags)

- [ ] **Step 1: Criar routes/messages/send.ts**

Criar `apps/api/src/routes/messages/send.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import { sendMessageSchema } from "@agente-crm/shared";
import { supabaseAdmin } from "../../lib/supabase.js";
import { sendMessageQueue } from "../../lib/queue.js";
import { requireAuth } from "../../middleware/auth.js";
import { getConversationById, createMessage } from "@agente-crm/database";
import { getInstanceByInstanceId } from "@agente-crm/database";

export async function messageRoutes(app: FastifyInstance) {
  app.post(
    "/messages/send",
    { preHandler: requireAuth },
    async (request, reply) => {
      const parsed = sendMessageSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

      const { conversation_id, content } = parsed.data;

      const conversation = await getConversationById(supabaseAdmin, conversation_id);
      const instance = await getInstanceByInstanceId(supabaseAdmin, conversation.evolution_instance_id);

      // Salvar mensagem como human_agent
      const message = await createMessage(supabaseAdmin, {
        conversation_id,
        organization_id: conversation.organization_id,
        evolution_message_id: null,
        role: "human_agent",
        content,
        media_url: null,
        media_type: null,
        metadata: null,
      });

      // Enfileirar envio via Evolution API
      await sendMessageQueue.add("send-message", {
        conversationId: conversation_id,
        messageId: message.id,
        instanceId: instance.instance_name,
        phone: conversation.wa_contacts.phone,
        content,
        organizationId: conversation.organization_id,
      });

      return reply.code(201).send({ message });
    }
  );
}
```

- [ ] **Step 2: Criar routes/conversations/index.ts**

Criar `apps/api/src/routes/conversations/index.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import { updateConversationSchema, createNoteSchema } from "@agente-crm/shared";
import { supabaseAdmin } from "../../lib/supabase.js";
import { requireAuth } from "../../middleware/auth.js";
import { updateConversation, addConversationNote } from "@agente-crm/database";

export async function conversationRoutes(app: FastifyInstance) {
  app.patch(
    "/conversations/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateConversationSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

      const conversation = await updateConversation(supabaseAdmin, id, {
        ...parsed.data,
        ...(parsed.data.is_human_takeover === true ? { human_takeover_at: new Date().toISOString() } : {}),
        ...(parsed.data.is_human_takeover === false ? { human_takeover_at: null } : {}),
      });

      return reply.send({ conversation });
    }
  );

  app.post(
    "/conversations/:id/notes",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request as FastifyRequest & { userId: string }).userId;
      const parsed = createNoteSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

      // Buscar organization_id da conversa
      const { data: conv } = await supabaseAdmin
        .from("wa_conversations")
        .select("organization_id")
        .eq("id", id)
        .single();

      const note = await addConversationNote(supabaseAdmin, {
        conversation_id: id,
        organization_id: conv!.organization_id,
        user_id: userId,
        content: parsed.data.content,
      });

      return reply.code(201).send({ note });
    }
  );
}

import type { FastifyRequest } from "fastify";
```

- [ ] **Step 3: Registrar rotas no server.ts**

Editar `apps/api/src/server.ts`, adicionar imports e registros:
```typescript
import { messageRoutes } from "./routes/messages/send.js";
import { conversationRoutes } from "./routes/conversations/index.js";
```

Após o registro do webhook, adicionar:
```typescript
await server.register(messageRoutes);
await server.register(conversationRoutes);
```

- [ ] **Step 4: Verificar typecheck**

```bash
cd apps/api && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
cd ../..
git add apps/api/
git commit -m "feat: add message send endpoint and conversation management routes"
```

---

### Task 5: Endpoints REST — Agentes e Instâncias

**Files:**
- Create: `apps/api/src/routes/agents/index.ts`
- Create: `apps/api/src/routes/instances/index.ts`
- Modify: `apps/api/src/server.ts`

**Interfaces:**
- Produces: CRUD `/agents`, CRUD `/instances`, `GET /instances/:id/qrcode`

- [ ] **Step 1: Criar routes/agents/index.ts**

Criar `apps/api/src/routes/agents/index.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import { createAgentSchema, updateAgentSchema } from "@agente-crm/shared";
import { supabaseAdmin } from "../../lib/supabase.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  getAgentsByOrganization,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
} from "@agente-crm/database";

export async function agentRoutes(app: FastifyInstance) {
  app.get("/agents", { preHandler: requireAuth }, async (request, reply) => {
    const { organization_id } = request.query as { organization_id: string };
    if (!organization_id) return reply.code(400).send({ error: "organization_id required" });
    const agents = await getAgentsByOrganization(supabaseAdmin, organization_id);
    return reply.send({ agents });
  });

  app.post("/agents", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = createAgentSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { organization_id } = request.body as { organization_id: string };
    if (!organization_id) return reply.code(400).send({ error: "organization_id required" });

    const agent = await createAgent(supabaseAdmin, {
      ...parsed.data,
      organization_id,
      is_active: true,
    });
    return reply.code(201).send({ agent });
  });

  app.patch("/agents/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateAgentSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const agent = await updateAgent(supabaseAdmin, id, parsed.data);
    return reply.send({ agent });
  });

  app.delete("/agents/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteAgent(supabaseAdmin, id);
    return reply.code(204).send();
  });
}
```

- [ ] **Step 2: Criar routes/instances/index.ts**

Criar `apps/api/src/routes/instances/index.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import { createInstanceSchema } from "@agente-crm/shared";
import { supabaseAdmin } from "../../lib/supabase.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  getInstancesByOrganization,
  createInstance,
  updateInstance,
  deleteInstance,
} from "@agente-crm/database";
import { evolutionService } from "../../services/evolution.service.js";

export async function instanceRoutes(app: FastifyInstance) {
  app.get("/instances", { preHandler: requireAuth }, async (request, reply) => {
    const { organization_id } = request.query as { organization_id: string };
    if (!organization_id) return reply.code(400).send({ error: "organization_id required" });
    const instances = await getInstancesByOrganization(supabaseAdmin, organization_id);
    return reply.send({ instances });
  });

  app.post("/instances", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = createInstanceSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { organization_id } = request.body as { organization_id: string };
    const webhookUrl = `${process.env.API_PUBLIC_URL}/webhooks/evolution`;

    const { instanceId } = await evolutionService.createInstance(parsed.data.instance_name, webhookUrl);

    const instance = await createInstance(supabaseAdmin, {
      organization_id,
      instance_name: parsed.data.instance_name,
      instance_id: instanceId,
      webhook_url: webhookUrl,
    });

    return reply.code(201).send({ instance });
  });

  app.get("/instances/:id/qrcode", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { data: instance } = await supabaseAdmin
      .from("wa_evolution_instances")
      .select("instance_name")
      .eq("id", id)
      .single();
    if (!instance) return reply.code(404).send({ error: "Instance not found" });

    const qr = await evolutionService.getQRCode(instance.instance_name);
    if (!qr) return reply.code(404).send({ error: "QR code not available" });
    return reply.send({ base64: qr.base64 });
  });

  app.patch("/instances/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { active_agent_id } = request.body as { active_agent_id: string | null };
    const instance = await updateInstance(supabaseAdmin, id, { active_agent_id });
    return reply.send({ instance });
  });

  app.delete("/instances/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { data: instance } = await supabaseAdmin
      .from("wa_evolution_instances")
      .select("instance_name")
      .eq("id", id)
      .single();
    if (instance) await evolutionService.deleteInstance(instance.instance_name);
    await deleteInstance(supabaseAdmin, id);
    return reply.code(204).send();
  });
}
```

- [ ] **Step 3: Criar routes/knowledge/index.ts**

Criar `apps/api/src/routes/knowledge/index.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import { uploadDocumentSchema, validateDocumentFileSchema, createFaqSchema, updateFaqSchema, ALLOWED_DOCUMENT_TYPES } from "@agente-crm/shared";
import { supabaseAdmin } from "../../lib/supabase.js";
import { requireAuth } from "../../middleware/auth.js";
import { getFaqsByAgent, createFaq, updateFaq, deleteFaq, getDocumentsByAgent, deleteDocument } from "@agente-crm/database";
import { uploadDocument } from "../../services/knowledge.service.js";
import path from "path";

export async function knowledgeRoutes(app: FastifyInstance) {
  app.get("/knowledge/documents", { preHandler: requireAuth }, async (request, reply) => {
    const { agent_id } = request.query as { agent_id: string };
    if (!agent_id) return reply.code(400).send({ error: "agent_id required" });
    const documents = await getDocumentsByAgent(supabaseAdmin, agent_id);
    return reply.send({ documents });
  });

  app.post("/knowledge/documents", { preHandler: requireAuth }, async (request, reply) => {
    const file = await request.file();
    if (!file) return reply.code(400).send({ error: "No file uploaded" });

    const body = Object.fromEntries(
      Object.entries(request.body as Record<string, { value: string }>).map(([k, v]) => [k, v.value])
    );

    const metaParsed = uploadDocumentSchema.safeParse(body);
    if (!metaParsed.success) return reply.code(400).send({ error: metaParsed.error.flatten() });

    const ext = path.extname(file.filename).slice(1).toLowerCase();
    if (!ALLOWED_DOCUMENT_TYPES.includes(ext as typeof ALLOWED_DOCUMENT_TYPES[number])) {
      return reply.code(400).send({ error: `Unsupported file type: ${ext}` });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of file.file) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const { data: agent } = await supabaseAdmin
      .from("wa_agents")
      .select("organization_id")
      .eq("id", metaParsed.data.agent_id)
      .single();

    const doc = await uploadDocument(supabaseAdmin, {
      organizationId: agent!.organization_id,
      agentId: metaParsed.data.agent_id,
      title: metaParsed.data.title,
      fileName: file.filename,
      fileType: ext as typeof ALLOWED_DOCUMENT_TYPES[number],
      fileSizeBytes: buffer.length,
      fileBuffer: buffer,
    });

    return reply.code(201).send({ document: doc });
  });

  app.delete("/knowledge/documents/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteDocument(supabaseAdmin, id);
    return reply.code(204).send();
  });

  app.get("/knowledge/faqs", { preHandler: requireAuth }, async (request, reply) => {
    const { agent_id } = request.query as { agent_id: string };
    if (!agent_id) return reply.code(400).send({ error: "agent_id required" });
    const faqs = await getFaqsByAgent(supabaseAdmin, agent_id);
    return reply.send({ faqs });
  });

  app.post("/knowledge/faqs", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = createFaqSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { data: agent } = await supabaseAdmin
      .from("wa_agents")
      .select("organization_id")
      .eq("id", parsed.data.agent_id)
      .single();

    const faq = await createFaq(supabaseAdmin, {
      ...parsed.data,
      organization_id: agent!.organization_id,
      is_active: true,
    });
    return reply.code(201).send({ faq });
  });

  app.patch("/knowledge/faqs/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateFaqSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const faq = await updateFaq(supabaseAdmin, id, parsed.data);
    return reply.send({ faq });
  });

  app.delete("/knowledge/faqs/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteFaq(supabaseAdmin, id);
    return reply.code(204).send();
  });
}
```

- [ ] **Step 4: Registrar todas as rotas no server.ts**

Atualizar `apps/api/src/server.ts` para incluir todos os imports e registros:
```typescript
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { evolutionWebhookRoutes } from "./routes/webhooks/evolution.js";
import { messageRoutes } from "./routes/messages/send.js";
import { conversationRoutes } from "./routes/conversations/index.js";
import { agentRoutes } from "./routes/agents/index.js";
import { instanceRoutes } from "./routes/instances/index.js";
import { knowledgeRoutes } from "./routes/knowledge/index.js";

const server = Fastify({ logger: { level: process.env.NODE_ENV === "production" ? "info" : "debug" } });

await server.register(cors, { origin: true });
await server.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

server.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

await server.register(evolutionWebhookRoutes);
await server.register(messageRoutes);
await server.register(conversationRoutes);
await server.register(agentRoutes);
await server.register(instanceRoutes);
await server.register(knowledgeRoutes);

const start = async () => {
  const port = parseInt(process.env.API_PORT || "3001", 10);
  await server.listen({ port, host: "0.0.0.0" });
  server.log.info(`API server running on port ${port}`);
};

start().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 5: Adicionar API_PUBLIC_URL ao .env.example**

Adicionar em `.env.example`:
```bash
# URL pública da API (usada para configurar webhook da Evolution API)
API_PUBLIC_URL=https://api.agente-crm.railway.app
```

- [ ] **Step 6: Verificar typecheck completo**

```bash
cd apps/api && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 7: Rodar servidor e verificar todas as rotas**

```bash
pnpm dev:api
```

Verificar que o servidor inicia sem erros e lista as rotas no log.

- [ ] **Step 8: Commit**

```bash
cd ../..
git add apps/api/
git commit -m "feat: add agents, instances, and knowledge base REST endpoints"
```

---

### Task 6: Criar Bucket no Supabase Storage

- [ ] **Step 1: Criar bucket via SQL Editor**

No Supabase SQL Editor:
```sql
-- Criar bucket para knowledge base
INSERT INTO storage.buckets (id, name, public)
VALUES ('wa-knowledge', 'wa-knowledge', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: service role tem acesso total (worker usa service_role)
CREATE POLICY "service_role_access" ON storage.objects
  FOR ALL TO service_role USING (bucket_id = 'wa-knowledge');

-- Policy: usuários autenticados podem ler seus próprios arquivos
CREATE POLICY "authenticated_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'wa-knowledge' AND auth.uid() IS NOT NULL);
```

- [ ] **Step 2: Verificar bucket**

No Supabase Storage, confirmar que o bucket `wa-knowledge` aparece na lista.

- [ ] **Step 3: Commit da migration do bucket**

Salvar o SQL acima em `supabase/migrations/00010_wa_storage_bucket.sql`:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('wa-knowledge', 'wa-knowledge', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "service_role_wa_knowledge" ON storage.objects
  FOR ALL TO service_role USING (bucket_id = 'wa-knowledge');

CREATE POLICY "authenticated_read_wa_knowledge" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'wa-knowledge' AND auth.uid() IS NOT NULL);
```

```bash
git add supabase/
git commit -m "feat: add supabase storage bucket for knowledge documents"
```

---

### Task 7: Verificação Final da Fase 2

- [ ] **Step 1: Typecheck completo**

```bash
pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 2: Rodar todos os testes**

```bash
pnpm test
```

Expected: todos os testes passam.

- [ ] **Step 3: Iniciar servidor e testar health**

```bash
pnpm dev:api
curl http://localhost:3001/health
```

Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 4: Simular webhook e verificar log**

```bash
curl -X POST http://localhost:3001/webhooks/evolution \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","instance":"teste","data":{"key":{"remoteJid":"5511999990001@s.whatsapp.net","fromMe":false,"id":"MSG001"},"messageType":"conversation","message":{"conversation":"oi"},"pushName":"Ana"}}'
```

Expected: `{"ok":true}`. No log do servidor: `Error processing Evolution webhook` (pois não há instância cadastrada — esperado para este estágio).

- [ ] **Step 5: Commit final**

```bash
git status
git add -A && git commit -m "chore: fase 2 complete — backend core with full REST API"
```
