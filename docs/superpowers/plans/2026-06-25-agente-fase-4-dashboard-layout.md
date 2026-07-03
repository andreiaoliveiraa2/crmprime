# Fase 4: Dashboard Auth & Layout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar o sistema de WhatsApp no `crm-seguros` existente: atualizar o sidebar para incluir a seção WhatsApp, criar o layout base de `/whatsapp/`, adicionar rotas BFF (API Routes Next.js que fazem proxy para o Fastify), e estabelecer a conexão com Supabase Realtime para updates ao vivo.

**Architecture:** Novas páginas em `crm-seguros/src/app/(dashboard)/whatsapp/`. Rotas API Next.js em `crm-seguros/src/app/api/whatsapp/` funcionam como BFF — recebem o token JWT do usuário, e repassam para o servidor Fastify em `agente-crm/apps/api`. Supabase Realtime via hook React para updates em tempo real.

**Tech Stack:** Next.js 16.2.6, React 19, TypeScript, Tailwind CSS 4, @supabase/ssr (existente), lucide-react (existente). Nenhuma nova dependência externa.

## Global Constraints

- Pasta: `C:\Users\Andreia Ferreira\crm-seguros\`
- Pré-requisito: Fases 1-3 concluídas (API do `agente-crm` rodando em porta 3001)
- Seguir padrões existentes do `crm-seguros` (layout, componentes, convenções)
- AGENTS.md diz "read the guide in `node_modules/next/dist/docs/` before writing any code" — ler antes de implementar
- Não modificar auth existente — usar a sessão Supabase já configurada
- BFF routes usam `getServerSession` do projeto e passam token Bearer para a API Fastify
- `NEXT_PUBLIC_API_URL` → URL pública do `agente-crm/apps/api` (ex: `http://localhost:3001` em dev)
- Prefixo de rota: `/whatsapp/` para todas as páginas novas

---

### Task 1: Ler Guias Necessários e Verificar Padrões Existentes

**Files:** (apenas leitura — nenhum arquivo criado nesta task)

- [ ] **Step 1: Ler guia de rotas do Next.js**

Verificar a versão do Next.js instalada:
```bash
cat crm-seguros/package.json | grep '"next"'
```

Ler documentação relevante:
```bash
ls crm-seguros/node_modules/next/dist/docs/
```

Verificar se existe guia de App Router:
```bash
ls crm-seguros/node_modules/next/dist/docs/ | grep -i route
```

- [ ] **Step 2: Verificar estrutura de rotas existente**

```bash
find crm-seguros/src/app -type f -name "*.tsx" | head -30
```

Expected: ver a estrutura do app router existente, arquivos `layout.tsx` e `page.tsx`.

- [ ] **Step 3: Verificar componentes existentes do sidebar**

Localizar o sidebar component atual. Procurar por `sidebar` nos componentes:
```bash
find crm-seguros/src -name "*.tsx" | xargs grep -l -i "sidebar" 2>/dev/null
```

Ler o arquivo encontrado para entender o padrão de itens de menu.

- [ ] **Step 4: Verificar cliente Supabase do projeto**

```bash
find crm-seguros/src/lib -name "*.ts" | head -10
```

Ler o arquivo de client do Supabase para entender como é usado no projeto.

- [ ] **Step 5: Verificar pattern de API Routes existentes**

```bash
find crm-seguros/src/app/api -type f -name "route.ts" | head -5
```

Ler um arquivo de exemplo para entender o padrão de autenticação nas API Routes.

---

### Task 2: Configurar Variáveis de Ambiente e BFF Client

**Files:**
- Modify: `crm-seguros/.env.local` (adicionar novas vars)
- Create: `crm-seguros/src/lib/whatsapp-api.ts`

**Interfaces:**
- Produces: `whatsappApi.get(path)`, `whatsappApi.post(path, body)`, `whatsappApi.patch(path, body)`, `whatsappApi.delete(path)` — funções do servidor que chamam a API Fastify com auth

- [ ] **Step 1: Adicionar variáveis ao .env.local**

Abrir `crm-seguros/.env.local` e adicionar ao final:
```bash
# WhatsApp Agent API (agente-crm/apps/api)
NEXT_PUBLIC_WA_API_URL=http://localhost:3001
WA_API_URL=http://localhost:3001
```

Também criar `.env.local.example` se não existir com as novas vars documentadas.

- [ ] **Step 2: Criar client BFF para uso em Server Components e API Routes**

Criar `crm-seguros/src/lib/whatsapp-api.ts`:
```typescript
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function waFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const baseUrl = process.env.WA_API_URL || "http://localhost:3001";

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

export const whatsappApi = {
  async get<T>(path: string): Promise<T> {
    const res = await waFetch(path);
    if (!res.ok) throw new Error(`WA API error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await waFetch(path, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`WA API error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await waFetch(path, { method: "PATCH", body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`WA API error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  async delete(path: string): Promise<void> {
    const res = await waFetch(path, { method: "DELETE" });
    if (!res.ok) throw new Error(`WA API error ${res.status}: ${await res.text()}`);
  },
};
```

- [ ] **Step 3: Criar client-side fetch helper (para Client Components)**

Criar `crm-seguros/src/lib/whatsapp-api-client.ts`:
```typescript
"use client";

async function waClientFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`/api/whatsapp${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

export const waClient = {
  async get<T>(path: string): Promise<T> {
    const res = await waClientFetch(path);
    if (!res.ok) throw new Error(`WA API error ${res.status}`);
    return res.json();
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await waClientFetch(path, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`WA API error ${res.status}`);
    return res.json();
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await waClientFetch(path, { method: "PATCH", body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`WA API error ${res.status}`);
    return res.json();
  },

  async delete(path: string): Promise<void> {
    const res = await waClientFetch(path, { method: "DELETE" });
    if (!res.ok) throw new Error(`WA API error ${res.status}`);
  },
};
```

- [ ] **Step 4: Verificar typecheck**

```bash
cd crm-seguros && pnpm typecheck
```

Expected: sem novos erros.

- [ ] **Step 5: Commit**

```bash
git add crm-seguros/src/lib/whatsapp-api.ts crm-seguros/src/lib/whatsapp-api-client.ts
git commit -m "feat: add WhatsApp BFF client helpers for server and client components"
```

---

### Task 3: Atualizar Sidebar com Seção WhatsApp

**Files:**
- Modify: arquivo do sidebar existente (identificado no Step 3 da Task 1)

**Interfaces:**
- Consumes: estrutura existente do sidebar
- Produces: novo grupo "WhatsApp" no sidebar com links para Inbox, Agentes, Instâncias, Configurações

- [ ] **Step 1: Identificar e ler o arquivo do sidebar**

Ler o arquivo do sidebar identificado na Task 1 Step 3. Identificar:
- Como os itens de menu são definidos (array de objetos? JSX diretamente?)
- Quais ícones são usados (lucide-react?)
- Como os grupos de menu são criados (se existem)

- [ ] **Step 2: Adicionar ícone de WhatsApp ao sidebar**

Verificar se `lucide-react` tem ícone adequado:
```bash
cd crm-seguros && grep -r "from 'lucide-react'" src/ | head -3
```

O ícone a usar é `MessageSquare` ou `Bot` do lucide-react.

- [ ] **Step 3: Adicionar grupo WhatsApp no sidebar**

Encontrar a seção de menu do sidebar e adicionar após os itens existentes. O padrão exato depende do que foi visto no Step 1. Estrutura lógica a adicionar:

**Se o sidebar usa um array de nav items:**
```typescript
// Adicionar ao array de navigationItems ou similar:
{
  group: "WhatsApp",
  items: [
    { label: "Inbox", href: "/whatsapp/inbox", icon: MessageSquare },
    { label: "Agentes", href: "/whatsapp/agents", icon: Bot },
    { label: "Instâncias", href: "/whatsapp/instances", icon: Wifi },
    { label: "Configurações", href: "/whatsapp/settings", icon: Settings },
  ],
}
```

**Se o sidebar usa JSX diretamente:**
```tsx
{/* WhatsApp Section */}
<div className="px-3 py-2">
  <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
    WhatsApp
  </h3>
  <nav className="space-y-1">
    <SidebarLink href="/whatsapp/inbox" icon={<MessageSquare className="h-4 w-4" />} label="Inbox" />
    <SidebarLink href="/whatsapp/agents" icon={<Bot className="h-4 w-4" />} label="Agentes" />
    <SidebarLink href="/whatsapp/instances" icon={<Wifi className="h-4 w-4" />} label="Instâncias" />
    <SidebarLink href="/whatsapp/settings" icon={<Settings className="h-4 w-4" />} label="Configurações" />
  </nav>
</div>
```

Adaptar ao padrão exato encontrado na leitura do Step 1.

- [ ] **Step 4: Verificar no browser**

```bash
cd crm-seguros && pnpm dev
```

Abrir `http://localhost:3000` e verificar que o sidebar mostra a seção "WhatsApp" com os 4 links.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add WhatsApp section to dashboard sidebar"
```

---

### Task 4: Layout Base do `/whatsapp/` e Página de Boas-vindas

**Files:**
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/layout.tsx`
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/page.tsx`
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/inbox/page.tsx` (placeholder)
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/agents/page.tsx` (placeholder)
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/instances/page.tsx` (placeholder)
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/settings/page.tsx` (placeholder)

**Nota:** Verificar em qual `(dashboard)` group os arquivos existentes ficam. Adaptar o path conforme a estrutura real do projeto. Se a estrutura for diferente (ex: `src/app/dashboard/`), ajustar os paths abaixo.

- [ ] **Step 1: Verificar estrutura de pastas do dashboard**

```bash
find crm-seguros/src/app -name "layout.tsx" | head -10
```

Identificar o path correto para o grupo de rotas do dashboard.

- [ ] **Step 2: Criar layout do WhatsApp**

Criar no path correto (ex: `crm-seguros/src/app/(dashboard)/whatsapp/layout.tsx`):
```tsx
export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Criar página principal /whatsapp/**

Criar `crm-seguros/src/app/(dashboard)/whatsapp/page.tsx`:
```tsx
import { Bot, MessageSquare, Wifi, Settings } from "lucide-react";
import Link from "next/link";

export default function WhatsAppPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Agente WhatsApp</h1>
        <p className="mt-2 text-muted-foreground">
          Gerencie seu assistente de IA integrado ao WhatsApp
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/whatsapp/inbox"
          className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary"
        >
          <MessageSquare className="h-8 w-8 text-primary" />
          <div className="text-center">
            <p className="font-semibold">Inbox</p>
            <p className="text-xs text-muted-foreground">Conversas em tempo real</p>
          </div>
        </Link>

        <Link
          href="/whatsapp/agents"
          className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary"
        >
          <Bot className="h-8 w-8 text-primary" />
          <div className="text-center">
            <p className="font-semibold">Agentes</p>
            <p className="text-xs text-muted-foreground">Configure os assistentes de IA</p>
          </div>
        </Link>

        <Link
          href="/whatsapp/instances"
          className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary"
        >
          <Wifi className="h-8 w-8 text-primary" />
          <div className="text-center">
            <p className="font-semibold">Instâncias</p>
            <p className="text-xs text-muted-foreground">Gerencie conexões WhatsApp</p>
          </div>
        </Link>

        <Link
          href="/whatsapp/settings"
          className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary"
        >
          <Settings className="h-8 w-8 text-primary" />
          <div className="text-center">
            <p className="font-semibold">Configurações</p>
            <p className="text-xs text-muted-foreground">API keys e preferências</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Criar placeholders para subpáginas**

Criar `crm-seguros/src/app/(dashboard)/whatsapp/inbox/page.tsx`:
```tsx
export default function InboxPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Inbox</h1>
      <p className="text-muted-foreground">Em construção — Fase 7</p>
    </div>
  );
}
```

Criar `crm-seguros/src/app/(dashboard)/whatsapp/agents/page.tsx`:
```tsx
export default function AgentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Agentes</h1>
      <p className="text-muted-foreground">Em construção — Fase 5</p>
    </div>
  );
}
```

Criar `crm-seguros/src/app/(dashboard)/whatsapp/instances/page.tsx`:
```tsx
export default function InstancesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Instâncias</h1>
      <p className="text-muted-foreground">Em construção — Fase 6</p>
    </div>
  );
}
```

Criar `crm-seguros/src/app/(dashboard)/whatsapp/settings/page.tsx`:
```tsx
export default function WhatsAppSettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <p className="text-muted-foreground">Em construção — Fase 8</p>
    </div>
  );
}
```

- [ ] **Step 5: Verificar no browser**

```bash
pnpm dev
```

Navegar para `http://localhost:3000/whatsapp`. Verificar que:
- Página principal mostra os 4 cards
- Os 4 links navegam para as subpáginas
- O sidebar mostra os links ativos corretamente

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add /whatsapp/ layout, landing page, and placeholder subpages"
```

---

### Task 5: BFF API Routes (Proxy para a API Fastify)

**Files:**
- Create: `crm-seguros/src/app/api/whatsapp/[...path]/route.ts`

**Interfaces:**
- Consumes: token JWT do usuário logado, `WA_API_URL` env
- Produces: proxy transparente para todos os endpoints da API Fastify

- [ ] **Step 1: Criar proxy BFF dinâmico**

Criar `crm-seguros/src/app/api/whatsapp/[...path]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function proxyToApi(request: NextRequest, params: { path: string[] }): Promise<NextResponse> {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = params.path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${process.env.WA_API_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let body: BodyInit | null = null;
  if (request.method !== "GET" && request.method !== "DELETE") {
    body = await request.text();
  }

  const response = await fetch(url, {
    method: request.method,
    headers,
    body: body || undefined,
  });

  const responseData = await response.text();
  return new NextResponse(responseData, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToApi(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToApi(req, await params);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToApi(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToApi(req, await params);
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
cd crm-seguros && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 3: Testar proxy em development**

Com API Fastify rodando (`pnpm dev:api` no `agente-crm`):
```bash
# Sem autenticação deve retornar 401
curl http://localhost:3000/api/whatsapp/health
```

Expected: `{"error":"Unauthorized"}`

Logado na aplicação (via browser), acessar `http://localhost:3000/api/whatsapp/health` deve retornar `{"status":"ok","timestamp":"..."}`.

- [ ] **Step 4: Commit**

```bash
git add crm-seguros/src/app/api/whatsapp/
git commit -m "feat: add BFF proxy route for WhatsApp API with JWT passthrough"
```

---

### Task 6: Hook de Supabase Realtime

**Files:**
- Create: `crm-seguros/src/hooks/use-wa-realtime.ts`

**Interfaces:**
- Produces: `useWaRealtime(table, filter, callback)` — subscribes to Supabase Realtime changes
- Produces: `useConversationMessages(conversationId)` — messages with live updates

- [ ] **Step 1: Criar hook de realtime**

Criar `crm-seguros/src/hooks/use-wa-realtime.ts`:
```typescript
"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function useWaRealtime(
  table: string,
  filter: string | null,
  callback: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = getBrowserClient();
    const channelName = `wa-${table}-${filter ?? "all"}-${Date.now()}`;

    let channel = supabase.channel(channelName);

    const config: Parameters<typeof channel.on>[1] = filter
      ? { event: "*", schema: "public", table, filter }
      : { event: "*", schema: "public", table };

    channel = channel.on(
      "postgres_changes" as Parameters<typeof channel.on>[0],
      config,
      callback
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}

export function useConversationMessages(conversationId: string | null, onNewMessage: () => void) {
  useWaRealtime(
    "wa_messages",
    conversationId ? `conversation_id=eq.${conversationId}` : null,
    (payload) => {
      if (payload.eventType === "INSERT") onNewMessage();
    }
  );
}

export function useConversationListRealtime(organizationId: string | null, onUpdate: () => void) {
  useWaRealtime(
    "wa_conversations",
    organizationId ? `organization_id=eq.${organizationId}` : null,
    () => onUpdate()
  );
}
```

- [ ] **Step 2: Criar hook de organização (para buscar org_id do usuário)**

Criar `crm-seguros/src/hooks/use-organization.ts`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export function useOrganization() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrg = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("wa_organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      setOrganizationId(data?.organization_id ?? null);
      setLoading(false);
    };

    fetchOrg();
  }, []);

  return { organizationId, loading };
}
```

- [ ] **Step 3: Verificar typecheck**

```bash
pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add crm-seguros/src/hooks/
git commit -m "feat: add realtime hooks for WhatsApp messages and conversations"
```

---

### Task 7: Verificação Final da Fase 4

- [ ] **Step 1: Typecheck completo**

```bash
cd crm-seguros && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 2: Build de produção**

```bash
pnpm build
```

Expected: build sem erros. Verificar que as novas páginas aparecem no output de build.

- [ ] **Step 3: Verificar visualmente**

```bash
pnpm dev
```

Abrir `http://localhost:3000`. Verificar:
1. Sidebar tem seção "WhatsApp" com 4 links
2. `/whatsapp/` mostra os 4 cards de navegação
3. Links do sidebar apontam para as subpáginas corretas
4. Subpáginas exibem o placeholder "Em construção"
5. Não há erros no console do browser

- [ ] **Step 4: Commit final**

```bash
git status
git add -A && git commit -m "chore: fase 4 complete — WhatsApp dashboard layout integrated into crm-seguros"
```
