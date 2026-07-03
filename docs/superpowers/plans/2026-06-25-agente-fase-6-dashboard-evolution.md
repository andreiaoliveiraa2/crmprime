# Fase 6: Dashboard Evolution API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a página `/whatsapp/instances` no `crm-seguros`: gerenciar instâncias da Evolution API, criar nova instância, exibir QR code para conexão via Supabase Realtime, ver status de conexão, vincular agente ativo à instância.

**Architecture:** Server Component para listagem inicial, Client Components para QR code polling (atualiza a cada 5s enquanto desconectado) e gerenciamento interativo. A conexão do WhatsApp requer mostrar o QR code ao usuário para escaneamento. O status é atualizado via webhook da Evolution API (Fase 2 já processa `CONNECTION_UPDATE`).

**Tech Stack:** Next.js 16.2.6, React 19, Tailwind CSS 4, lucide-react

## Global Constraints

- Pasta: `crm-seguros/src/app/(dashboard)/whatsapp/instances/`
- Pré-requisito: Fases 2 e 4 concluídas (instâncias criáveis via API, BFF funcionando)
- QR code expira em ~20s na Evolution API — polling a cada 15s enquanto status = 'connecting'
- Evolution API precisa estar rodando e acessível pelo `agente-crm/apps/api`
- `API_PUBLIC_URL` precisa estar configurado no `agente-crm/.env` para o webhook funcionar

---

### Task 1: Página de Listagem de Instâncias

**Files:**
- Modify: `crm-seguros/src/app/(dashboard)/whatsapp/instances/page.tsx`
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/instances/instances-list.tsx`
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/instances/instance-card.tsx`
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/instances/create-instance-dialog.tsx`

**Interfaces:**
- Consumes: `GET /api/whatsapp/instances?organization_id=...`, `POST /api/whatsapp/instances`, `DELETE /api/whatsapp/instances/:id`
- Produces: lista de instâncias com status visual, botão de criar

- [ ] **Step 1: Criar component InstanceCard**

Criar `crm-seguros/src/app/(dashboard)/whatsapp/instances/instance-card.tsx`:
```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Wifi, WifiOff, QrCode, Trash2, Bot, RefreshCw } from "lucide-react";
import type { WaAgent } from "@agente-crm/shared";

interface WaInstance {
  id: string;
  instance_name: string;
  instance_id: string;
  status: "connected" | "disconnected" | "connecting";
  phone_number: string | null;
  active_agent_id: string | null;
  wa_agents?: { id: string; name: string; mode: string } | null;
}

interface Props {
  instance: WaInstance;
  agents: WaAgent[];
  onDeleted: () => void;
  onUpdated: () => void;
}

function StatusBadge({ status }: { status: WaInstance["status"] }) {
  const config = {
    connected: { icon: Wifi, label: "Conectado", className: "bg-green-100 text-green-700" },
    disconnected: { icon: WifiOff, label: "Desconectado", className: "bg-gray-100 text-gray-600" },
    connecting: { icon: RefreshCw, label: "Conectando...", className: "bg-yellow-100 text-yellow-700 animate-pulse" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export function InstanceCard({ instance, agents, onDeleted, onUpdated }: Props) {
  const [showQR, setShowQR] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(instance.active_agent_id || "");
  const [savingAgent, setSavingAgent] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQRCode = async () => {
    setLoadingQR(true);
    try {
      const res = await fetch(`/api/whatsapp/instances/${instance.id}/qrcode`);
      if (res.ok) {
        const data = await res.json() as { base64: string };
        setQrBase64(data.base64);
      } else {
        setQrBase64(null);
      }
    } catch {
      setQrBase64(null);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleConnectClick = async () => {
    setShowQR(true);
    await fetchQRCode();
    // Poll para QR code atualizado
    pollingRef.current = setInterval(fetchQRCode, 15000);
  };

  useEffect(() => {
    if (instance.status === "connected" && pollingRef.current) {
      clearInterval(pollingRef.current);
      setShowQR(false);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [instance.status]);

  const handleSaveAgent = async () => {
    setSavingAgent(true);
    await fetch(`/api/whatsapp/instances/${instance.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active_agent_id: selectedAgentId || null }),
    });
    setSavingAgent(false);
    onUpdated();
  };

  const handleDelete = async () => {
    if (!confirm(`Excluir instância "${instance.instance_name}"? Isso desconectará o WhatsApp.`)) return;
    await fetch(`/api/whatsapp/instances/${instance.id}`, { method: "DELETE" });
    onDeleted();
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{instance.instance_name}</h3>
              <StatusBadge status={instance.status} />
            </div>
            {instance.phone_number && (
              <p className="mt-0.5 text-sm text-muted-foreground">{instance.phone_number}</p>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Agente ativo */}
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Agente ativo</label>
          <div className="flex gap-2">
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">Nenhum agente vinculado</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.mode === "mpa" ? "MPA" : "Atendimento"})
                </option>
              ))}
            </select>
            <button
              onClick={handleSaveAgent}
              disabled={savingAgent || selectedAgentId === (instance.active_agent_id || "")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {savingAgent ? "..." : "Salvar"}
            </button>
          </div>
        </div>

        {/* Conectar / QR Code */}
        {instance.status !== "connected" && (
          <div className="mt-4">
            {!showQR ? (
              <button
                onClick={handleConnectClick}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all"
              >
                <QrCode className="h-4 w-4" />
                Conectar WhatsApp (escanear QR code)
              </button>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">Escaneie o QR code no WhatsApp</p>
                <p className="text-xs text-muted-foreground">WhatsApp → Configurações → Dispositivos conectados</p>
                {loadingQR ? (
                  <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-muted">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : qrBase64 ? (
                  <img
                    src={`data:image/png;base64,${qrBase64}`}
                    alt="WhatsApp QR Code"
                    className="h-48 w-48 rounded-lg"
                  />
                ) : (
                  <div className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-lg border">
                    <QrCode className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">QR code não disponível</p>
                    <button onClick={fetchQRCode} className="text-xs text-primary underline">Tentar novamente</button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Atualiza automaticamente a cada 15 segundos</p>
                <button onClick={() => setShowQR(false)} className="text-xs text-muted-foreground underline">Cancelar</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar CreateInstanceDialog**

Criar `crm-seguros/src/app/(dashboard)/whatsapp/instances/create-instance-dialog.tsx`:
```tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  organizationId: string;
  onCreated: () => void;
  onCancel: () => void;
}

export function CreateInstanceDialog({ organizationId, onCreated, onCancel }: Props) {
  const [instanceName, setInstanceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/whatsapp/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instance_name: instanceName.trim().toLowerCase().replace(/\s+/g, "-"),
          organization_id: organizationId,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error || "Erro ao criar instância");
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nova Instância WhatsApp</h2>
          <button onClick={onCancel} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">Nome da instância *</label>
            <input
              type="text"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="ex: corretora-principal"
              required
              pattern="[a-zA-Z0-9\-]+"
              title="Use apenas letras, números e hífens"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Apenas letras, números e hífens. Será convertido para minúsculas.
            </p>
          </div>

          <div className="mb-6 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Próximo passo:</strong> Após criar, você precisará escanear um QR code para conectar o número do WhatsApp.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !instanceName.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar instância"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Criar InstancesList**

Criar `crm-seguros/src/app/(dashboard)/whatsapp/instances/instances-list.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Wifi } from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";
import { InstanceCard } from "./instance-card";
import { CreateInstanceDialog } from "./create-instance-dialog";
import type { WaAgent } from "@agente-crm/shared";

interface WaInstance {
  id: string;
  instance_name: string;
  instance_id: string;
  status: "connected" | "disconnected" | "connecting";
  phone_number: string | null;
  active_agent_id: string | null;
  wa_agents?: { id: string; name: string; mode: string } | null;
}

export function InstancesList() {
  const { organizationId } = useOrganization();
  const [instances, setInstances] = useState<WaInstance[]>([]);
  const [agents, setAgents] = useState<WaAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [instRes, agentsRes] = await Promise.all([
        fetch(`/api/whatsapp/instances?organization_id=${organizationId}`),
        fetch(`/api/whatsapp/agents?organization_id=${organizationId}`),
      ]);
      if (instRes.ok) setInstances((await instRes.json() as { instances: WaInstance[] }).instances);
      if (agentsRes.ok) setAgents((await agentsRes.json() as { agents: WaAgent[] }).agents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [organizationId]);

  if (loading) return <div className="p-6 text-muted-foreground">Carregando instâncias...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instâncias WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie conexões via Evolution API</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova Instância
        </button>
      </div>

      {showCreate && organizationId && (
        <CreateInstanceDialog
          organizationId={organizationId}
          onCreated={() => { setShowCreate(false); fetchData(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Wifi className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">Nenhuma instância criada</p>
          <p className="text-sm text-muted-foreground">Crie uma instância para conectar seu número do WhatsApp</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              agents={agents}
              onDeleted={fetchData}
              onUpdated={fetchData}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Atualizar page.tsx**

Substituir `crm-seguros/src/app/(dashboard)/whatsapp/instances/page.tsx`:
```tsx
import { InstancesList } from "./instances-list";

export default function InstancesPage() {
  return <InstancesList />;
}
```

- [ ] **Step 5: Criar rota BFF para QR code**

Criar `crm-seguros/src/app/api/whatsapp/instances/[id]/qrcode/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getToken() {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll() } });
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await fetch(`${process.env.WA_API_URL}/instances/${id}/qrcode`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { "Content-Type": "application/json" } });
}
```

- [ ] **Step 6: Criar rota BFF para PATCH e DELETE de instâncias**

Criar `crm-seguros/src/app/api/whatsapp/instances/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getToken() {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll() } });
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await fetch(`${process.env.WA_API_URL}/instances/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: await req.text(),
  });
  return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await fetch(`${process.env.WA_API_URL}/instances/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return new NextResponse(null, { status: res.status });
}
```

- [ ] **Step 7: Verificar typecheck**

```bash
cd crm-seguros && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 8: Testar no browser**

```bash
pnpm dev
```

Com Evolution API rodando (`EVOLUTION_API_URL` configurado):
1. Navegar para `/whatsapp/instances`
2. Criar nova instância → dialog aparece, nome validado
3. Clicar "Conectar WhatsApp" → deve exibir QR code (requer Evolution API ativa) ou placeholder
4. Vincular agente → dropdown mostra agentes criados na Fase 5
5. Excluir instância → confirmação e remoção

- [ ] **Step 9: Commit final**

```bash
git add -A
git commit -m "feat: add WhatsApp instances page with QR code, agent binding, and status"
```

---

### Task 2: Atualizar Status via Webhook `CONNECTION_UPDATE`

**Files:**
- Modify: `agente-crm/apps/api/src/routes/webhooks/evolution.ts`

**Objetivo:** O webhook já existe (Fase 2). Adicionar handling do evento `CONNECTION_UPDATE` para atualizar o status da instância no banco e transmitir para o dashboard via Supabase Realtime.

- [ ] **Step 1: Adicionar handling de CONNECTION_UPDATE no webhook**

Editar `agente-crm/apps/api/src/routes/webhooks/evolution.ts`. Após a verificação do evento `messages.upsert`, adicionar:

```typescript
// Tratamento do CONNECTION_UPDATE (status da instância)
if (event === "connection.update") {
  try {
    const connectionState = (data as unknown as { state?: string }).state;
    const newStatus = connectionState === "open" ? "connected"
      : connectionState === "connecting" ? "connecting"
      : "disconnected";

    const phoneNumber = (data as unknown as { number?: string }).number ?? null;

    await supabaseAdmin
      .from("wa_evolution_instances")
      .update({ status: newStatus, ...(phoneNumber ? { phone_number: phoneNumber } : {}) })
      .eq("instance_id", instanceName);

    app.log.info({ instanceName, newStatus }, "Instance connection updated");
  } catch (err) {
    app.log.error({ err }, "Error processing CONNECTION_UPDATE");
  }
  return;
}
```

- [ ] **Step 2: Typecheck**

```bash
cd agente-crm && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add agente-crm/apps/api/
git commit -m "feat: handle CONNECTION_UPDATE webhook to update instance status"
```

---

### Task 3: Atualização em Tempo Real do Status (Supabase Realtime)

**Files:**
- Modify: `crm-seguros/src/app/(dashboard)/whatsapp/instances/instances-list.tsx`

**Objetivo:** Usar o hook `useWaRealtime` (criado na Fase 4) para escutar mudanças na tabela `wa_evolution_instances` e atualizar a lista sem refresh manual.

- [ ] **Step 1: Adicionar realtime à lista de instâncias**

Editar `instances-list.tsx` para adicionar o hook de realtime:

Adicionar import:
```typescript
import { useWaRealtime } from "@/hooks/use-wa-realtime";
```

Dentro do componente `InstancesList`, após o `useEffect` de fetch, adicionar:
```typescript
useWaRealtime(
  "wa_evolution_instances",
  organizationId ? `organization_id=eq.${organizationId}` : null,
  (payload) => {
    if (payload.eventType === "UPDATE") {
      setInstances((prev) =>
        prev.map((inst) =>
          inst.id === (payload.new as { id: string }).id
            ? { ...inst, ...(payload.new as Partial<WaInstance>) }
            : inst
        )
      );
    }
  }
);
```

- [ ] **Step 2: Testar atualização em tempo real**

Com Evolution API conectada e webhook configurado:
1. Abrir `/whatsapp/instances`
2. Conectar uma instância via QR code
3. Verificar que o status muda de "Conectando..." para "Conectado" sem refresh manual

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add realtime status updates for WhatsApp instances"
```

---

### Task 4: Verificação Final da Fase 6

- [ ] **Step 1: Typecheck completo**

```bash
cd crm-seguros && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 2: Build de produção**

```bash
pnpm build
```

Expected: build sem erros.

- [ ] **Step 3: Verificar fluxo completo**

1. Criar instância → nome validado, instância criada
2. QR code exibido (com Evolution API) ou placeholder informativo
3. Vincular agente → dropdown com agentes disponíveis
4. Status atualizado em tempo real via Realtime
5. Excluir instância → confirmação e remoção

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore: fase 6 complete — WhatsApp instances dashboard with QR code and realtime"
```
