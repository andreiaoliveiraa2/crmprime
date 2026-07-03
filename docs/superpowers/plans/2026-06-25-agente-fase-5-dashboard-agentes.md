# Fase 5: Dashboard de Agentes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a página `/whatsapp/agents` no `crm-seguros` com CRUD completo de agentes de IA: criar/editar agente, configurar modo (MPA ou atendimento), upload de documentos para knowledge base, gerenciar FAQs.

**Architecture:** Server Components para listagem (dados no servidor), Client Components para formulários interativos e upload de arquivos. Upload de documentos usa FormData enviado para a BFF `/api/whatsapp/knowledge/documents`. Cada card de agente expande para mostrar sua knowledge base e FAQs.

**Tech Stack:** Next.js 16.2.6, React 19, TypeScript, Tailwind CSS 4, lucide-react

## Global Constraints

- Pasta: `crm-seguros/src/app/(dashboard)/whatsapp/agents/`
- Pré-requisito: Fase 4 concluída (BFF proxy funcionando)
- Seguir padrões de UI existentes do `crm-seguros` (botões, inputs, cards, dialogs)
- Upload máximo: 50MB por documento
- Tipos permitidos: pdf, txt, md, docx, csv
- `organization_id` vem do hook `useOrganization` (criado na Fase 4)

---

### Task 1: Página de Listagem de Agentes

**Files:**
- Modify: `crm-seguros/src/app/(dashboard)/whatsapp/agents/page.tsx`
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/agents/agents-list.tsx`

**Interfaces:**
- Consumes: `GET /api/whatsapp/agents?organization_id=...`
- Produces: página com lista de agentes MPA e de atendimento, botão de criar

- [ ] **Step 1: Verificar componentes existentes no projeto**

```bash
find crm-seguros/src/components -name "*.tsx" | head -20
```

Identificar: existe algum componente de Card, Button, Dialog, Badge? Verificar quais usar para seguir o padrão.

- [ ] **Step 2: Criar componente AgentsList (Client Component)**

Criar `crm-seguros/src/app/(dashboard)/whatsapp/agents/agents-list.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { Bot, Plus, Pencil, Trash2, FileText, HelpCircle } from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";
import { waClient } from "@/lib/whatsapp-api-client";
import { AgentForm } from "./agent-form";
import { AgentKnowledge } from "./agent-knowledge";
import type { WaAgent } from "@agente-crm/shared";

export function AgentsList() {
  const { organizationId } = useOrganization();
  const [agents, setAgents] = useState<WaAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<WaAgent | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const fetchAgents = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const data = await waClient.get<{ agents: WaAgent[] }>(`/agents?organization_id=${organizationId}`);
      setAgents(data.agents);
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, [organizationId]);

  const handleDelete = async (agentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este agente?")) return;
    try {
      await waClient.delete(`/agents/${agentId}`);
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
    } catch (err) {
      alert("Erro ao excluir agente.");
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingAgent(null);
    fetchAgents();
  };

  if (loading) return <div className="p-6 text-muted-foreground">Carregando agentes...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agentes de IA</h1>
          <p className="text-muted-foreground">Configure os assistentes do WhatsApp</p>
        </div>
        <button
          onClick={() => { setEditingAgent(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Agente
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <AgentForm
            agent={editingAgent}
            organizationId={organizationId!}
            onSaved={handleSaved}
            onCancel={() => { setShowForm(false); setEditingAgent(null); }}
          />
        </div>
      )}

      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Bot className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">Nenhum agente criado</p>
          <p className="text-sm text-muted-foreground">Crie um agente para começar a atender via WhatsApp</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-xl border bg-card shadow-sm">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${agent.mode === "mpa" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{agent.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${agent.mode === "mpa" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {agent.mode === "mpa" ? "Assistente MPA" : "Atendimento"}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${agent.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {agent.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Base de conhecimento
                  </button>
                  <button
                    onClick={() => { setEditingAgent(agent); setShowForm(true); }}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedAgent === agent.id && (
                <div className="border-t p-4">
                  <AgentKnowledge agentId={agent.id} organizationId={organizationId!} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Atualizar page.tsx**

Substituir `crm-seguros/src/app/(dashboard)/whatsapp/agents/page.tsx`:
```tsx
import { AgentsList } from "./agents-list";

export default function AgentsPage() {
  return <AgentsList />;
}
```

- [ ] **Step 4: Verificar typecheck**

```bash
cd crm-seguros && pnpm typecheck
```

Expected: pode haver erros de imports para `AgentForm` e `AgentKnowledge` que ainda não existem. Criar arquivos temporários:

```bash
# Criar temporariamente para o typecheck passar
```

Criar `crm-seguros/src/app/(dashboard)/whatsapp/agents/agent-form.tsx`:
```tsx
"use client";
export function AgentForm(_props: any) { return null; }
```

Criar `crm-seguros/src/app/(dashboard)/whatsapp/agents/agent-knowledge.tsx`:
```tsx
"use client";
export function AgentKnowledge(_props: any) { return null; }
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add agents listing page with expand/collapse"
```

---

### Task 2: Formulário de Criação/Edição de Agente

**Files:**
- Modify: `crm-seguros/src/app/(dashboard)/whatsapp/agents/agent-form.tsx`

**Interfaces:**
- Consumes: `WaAgent | null` (null = novo), `organizationId`
- Produces: formulário com campos para nome, description, system_prompt, mode, model, temperature, max_tokens, is_active

- [ ] **Step 1: Implementar AgentForm completo**

Substituir `crm-seguros/src/app/(dashboard)/whatsapp/agents/agent-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { waClient } from "@/lib/whatsapp-api-client";
import type { WaAgent } from "@agente-crm/shared";

interface Props {
  agent: WaAgent | null;
  organizationId: string;
  onSaved: () => void;
  onCancel: () => void;
}

const MPA_SYSTEM_PROMPT_TEMPLATE = `Você é o MPA — assistente executiva da corretora.
Você conhece as 6 frentes de trabalho: Assistente, Clientes, Financeiro, Operadoras, Comercial e Marketing.
Seja direta, objetiva e prática. Responda como uma sócia experiente.
Consulte a base de conhecimento para informações específicas.`;

const ATTENDANCE_SYSTEM_PROMPT_TEMPLATE = `Você é a assistente de atendimento da corretora.
Seu objetivo é qualificar leads: entender a necessidade e coletar informações básicas.
Seja acolhedora e profissional. Nunca prometa valores ou coberturas sem confirmar.
Quando tiver nome e interesse do cliente, use a ferramenta createLead para registrar.`;

export function AgentForm({ agent, organizationId, onSaved, onCancel }: Props) {
  const isEditing = !!agent;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: agent?.name || "",
    description: agent?.description || "",
    system_prompt: agent?.system_prompt || MPA_SYSTEM_PROMPT_TEMPLATE,
    mode: agent?.mode || "mpa",
    model: agent?.model || "gemini-1.5-flash",
    provider: agent?.provider || "google",
    temperature: agent?.temperature || 0.7,
    max_tokens: agent?.max_tokens || 1024,
    is_active: agent?.is_active ?? true,
    tools_config: agent?.tools_config || {
      search_knowledge: true,
      search_faq: true,
      crm_access: false,
      create_lead: false,
    },
  });

  const handleModeChange = (mode: "mpa" | "client_attendance") => {
    setForm((prev) => ({
      ...prev,
      mode,
      system_prompt: prev.system_prompt.length < 30
        ? (mode === "mpa" ? MPA_SYSTEM_PROMPT_TEMPLATE : ATTENDANCE_SYSTEM_PROMPT_TEMPLATE)
        : prev.system_prompt,
      tools_config: {
        search_knowledge: true,
        search_faq: true,
        crm_access: mode === "mpa",
        create_lead: mode === "client_attendance",
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        await waClient.patch(`/agents/${agent.id}`, form);
      } else {
        await waClient.post("/agents", { ...form, organization_id: organizationId });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar agente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{isEditing ? "Editar Agente" : "Novo Agente"}</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Mode selector */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">Modo do Agente</label>
        <div className="flex gap-3">
          {(["mpa", "client_attendance"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleModeChange(mode)}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm transition-all ${
                form.mode === mode
                  ? "border-primary bg-primary/5 font-medium text-primary"
                  : "hover:border-muted-foreground/40"
              }`}
            >
              {mode === "mpa" ? "🤖 Assistente MPA" : "👋 Atendimento ao Cliente"}
              <p className="mt-1 text-xs text-muted-foreground font-normal">
                {mode === "mpa" ? "Para corretores cadastrados" : "Para clientes desconhecidos"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Nome *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ex: MPA da Andreia"
            required
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Modelo LLM</label>
          <select
            value={form.model}
            onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="gemini-1.5-flash">Gemini 1.5 Flash (rápido, gratuito)</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro (mais capaz)</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash (mais novo)</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium">Descrição</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Breve descrição do agente"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium">Instruções do Sistema (System Prompt) *</label>
        <textarea
          value={form.system_prompt}
          onChange={(e) => setForm((p) => ({ ...p, system_prompt: e.target.value }))}
          rows={6}
          required
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Defina o comportamento e personalidade do agente.
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Temperatura: {form.temperature}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={form.temperature}
            onChange={(e) => setForm((p) => ({ ...p, temperature: parseFloat(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Preciso</span>
            <span>Criativo</span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Máx. tokens</label>
          <input
            type="number"
            value={form.max_tokens}
            onChange={(e) => setForm((p) => ({ ...p, max_tokens: parseInt(e.target.value) }))}
            min="256"
            max="8192"
            step="256"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={form.is_active}
          onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
          className="h-4 w-4"
        />
        <label htmlFor="is_active" className="text-sm font-medium">Agente ativo</label>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar agente"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 3: Testar no browser**

```bash
pnpm dev
```

Navegar para `/whatsapp/agents`. Verificar:
- Botão "Novo Agente" abre o formulário
- Seletor de modo exibe as opções corretamente
- Formulário valida campos obrigatórios

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add agent create/edit form with mode selector"
```

---

### Task 3: Knowledge Base — Upload de Documentos e FAQs

**Files:**
- Modify: `crm-seguros/src/app/(dashboard)/whatsapp/agents/agent-knowledge.tsx`

**Interfaces:**
- Consumes: `agentId`, `organizationId`, `GET /api/whatsapp/knowledge/documents?agent_id=...`, `POST /api/whatsapp/knowledge/documents`, `GET /api/whatsapp/knowledge/faqs?agent_id=...`, `POST/PATCH/DELETE /api/whatsapp/knowledge/faqs/:id`
- Produces: seção expandida com lista de documentos, upload de arquivo, lista de FAQs, CRUD de FAQs

- [ ] **Step 1: Criar rota BFF para upload de documentos com FormData**

Criar `crm-seguros/src/app/api/whatsapp/knowledge/documents/route.ts`:
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

export async function GET(req: NextRequest) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agentId = req.nextUrl.searchParams.get("agent_id");
  const res = await fetch(`${process.env.WA_API_URL}/knowledge/documents?agent_id=${agentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { "Content-Type": "application/json" } });
}

export async function POST(req: NextRequest) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // FormData passthrough (multipart)
  const formData = await req.formData();
  const res = await fetch(`${process.env.WA_API_URL}/knowledge/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { "Content-Type": "application/json" } });
}
```

- [ ] **Step 2: Implementar AgentKnowledge completo**

Substituir `crm-seguros/src/app/(dashboard)/whatsapp/agents/agent-knowledge.tsx`:
```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Plus, FileText, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { WaKnowledgeDocument, WaKnowledgeFaq } from "@agente-crm/shared";

interface Props {
  agentId: string;
  organizationId: string;
}

function DocumentStatus({ status }: { status: WaKnowledgeDocument["status"] }) {
  if (status === "ready") return <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" /> Pronto</span>;
  if (status === "processing") return <span className="flex items-center gap-1 text-xs text-yellow-600"><Clock className="h-3 w-3" /> Processando...</span>;
  return <span className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> Erro</span>;
}

export function AgentKnowledge({ agentId, organizationId }: Props) {
  const [documents, setDocuments] = useState<WaKnowledgeDocument[]>([]);
  const [faqs, setFaqs] = useState<WaKnowledgeFaq[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"documents" | "faqs">("documents");
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [addingFaq, setAddingFaq] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    const res = await fetch(`/api/whatsapp/knowledge/documents?agent_id=${agentId}`);
    if (res.ok) {
      const data = await res.json() as { documents: WaKnowledgeDocument[] };
      setDocuments(data.documents);
    }
  };

  const fetchFaqs = async () => {
    const res = await fetch(`/api/whatsapp/knowledge/faqs?agent_id=${agentId}`);
    if (res.ok) {
      const data = await res.json() as { faqs: WaKnowledgeFaq[] };
      setFaqs(data.faqs);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchFaqs();
  }, [agentId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
    formData.append("agent_id", agentId);

    try {
      const res = await fetch("/api/whatsapp/knowledge/documents", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload falhou");
      await fetchDocuments();
    } catch (err) {
      alert("Erro ao fazer upload do documento.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Excluir este documento?")) return;
    await fetch(`/api/whatsapp/knowledge/documents/${docId}`, { method: "DELETE" });
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleAddFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    const res = await fetch("/api/whatsapp/knowledge/faqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId, ...newFaq }),
    });
    if (res.ok) {
      setNewFaq({ question: "", answer: "" });
      setAddingFaq(false);
      fetchFaqs();
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    await fetch(`/api/whatsapp/knowledge/faqs/${faqId}`, { method: "DELETE" });
    setFaqs((prev) => prev.filter((f) => f.id !== faqId));
  };

  const handleToggleFaq = async (faqId: string, isActive: boolean) => {
    await fetch(`/api/whatsapp/knowledge/faqs/${faqId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    fetchFaqs();
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all ${activeTab === "documents" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
        >
          <FileText className="h-4 w-4" />
          Documentos ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab("faqs")}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all ${activeTab === "faqs" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
        >
          <MessageSquare className="h-4 w-4" />
          FAQs ({faqs.length})
        </button>
      </div>

      {activeTab === "documents" && (
        <div>
          <div className="mb-3">
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.docx,.csv" onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary disabled:opacity-50 w-full justify-center"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Enviando..." : "Enviar documento (PDF, TXT, MD, DOCX, CSV — máx 50MB)"}
            </button>
          </div>

          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum documento. Envie documentos para que o agente use como referência.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{doc.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{doc.file_name}</span>
                      <span>{doc.chunk_count} chunks</span>
                      <DocumentStatus status={doc.status} />
                    </div>
                  </div>
                  <button onClick={() => handleDeleteDocument(doc.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "faqs" && (
        <div>
          <button
            onClick={() => setAddingFaq(true)}
            className="mb-3 flex items-center gap-2 rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary w-full justify-center"
          >
            <Plus className="h-4 w-4" />
            Adicionar FAQ
          </button>

          {addingFaq && (
            <div className="mb-3 rounded-lg border bg-muted/30 p-3">
              <input
                placeholder="Pergunta"
                value={newFaq.question}
                onChange={(e) => setNewFaq((p) => ({ ...p, question: e.target.value }))}
                className="mb-2 w-full rounded border bg-background px-3 py-1.5 text-sm"
              />
              <textarea
                placeholder="Resposta"
                value={newFaq.answer}
                onChange={(e) => setNewFaq((p) => ({ ...p, answer: e.target.value }))}
                rows={3}
                className="mb-2 w-full rounded border bg-background px-3 py-1.5 text-sm"
              />
              <div className="flex gap-2">
                <button onClick={handleAddFaq} className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground">Salvar</button>
                <button onClick={() => setAddingFaq(false)} className="rounded border px-3 py-1.5 text-xs">Cancelar</button>
              </div>
            </div>
          )}

          {faqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma FAQ. Adicione perguntas frequentes para respostas padronizadas.</p>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq) => (
                <div key={faq.id} className={`rounded-lg border px-3 py-2 ${!faq.is_active ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{faq.question}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{faq.answer}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleFaq(faq.id, faq.is_active)}
                        className={`rounded px-2 py-1 text-xs ${faq.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {faq.is_active ? "Ativa" : "Inativa"}
                      </button>
                      <button onClick={() => handleDeleteFaq(faq.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Criar rotas BFF para FAQs**

Criar `crm-seguros/src/app/api/whatsapp/knowledge/faqs/route.ts`:
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

export async function GET(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agentId = req.nextUrl.searchParams.get("agent_id");
  const res = await fetch(`${process.env.WA_API_URL}/knowledge/faqs?agent_id=${agentId}`, { headers: { Authorization: `Bearer ${token}` } });
  return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}

export async function POST(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${process.env.WA_API_URL}/knowledge/faqs`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: await req.text() });
  return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}
```

Criar `crm-seguros/src/app/api/whatsapp/knowledge/faqs/[id]/route.ts`:
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
  const res = await fetch(`${process.env.WA_API_URL}/knowledge/faqs/${id}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: await req.text() });
  return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await fetch(`${process.env.WA_API_URL}/knowledge/faqs/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  return new NextResponse(null, { status: res.status });
}
```

- [ ] **Step 4: Verificar typecheck**

```bash
cd crm-seguros && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 5: Testar no browser**

```bash
pnpm dev
```

Navegar para `/whatsapp/agents`. Verificar:
- Clicar em "Base de conhecimento" expande o painel
- Abas "Documentos" e "FAQs" funcionam
- Upload de arquivo .txt dispara processamento
- Adicionar FAQ salva e aparece na lista

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add knowledge base UI with document upload and FAQ management"
```

---

### Task 4: Importar Agentes MPA como Documentos

**Objetivo:** Criar um script utilitário para importar os 46 arquivos `.md` da pasta `Desktop/MPA/.claude/` como documentos na knowledge base do agente MPA.

**Files:**
- Create: `agente-crm/scripts/import-mpa-knowledge.ts`

- [ ] **Step 1: Criar script de importação**

Criar `agente-crm/scripts/import-mpa-knowledge.ts`:
```typescript
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { getAdminClient } from "../packages/database/src/admin.js";
import { insertChunks, createDocument, updateDocument } from "../packages/database/src/queries/knowledge.js";
import { chunkText } from "../apps/worker/src/lib/chunker.js";
import { embedBatch } from "../apps/worker/src/lib/embeddings.js";

const MPA_FOLDER = path.join(process.env.HOME || "C:/Users/Andreia Ferreira", "Desktop/MPA/.claude");
const AGENT_ID = process.env.MPA_AGENT_ID!;
const ORGANIZATION_ID = process.env.ORGANIZATION_ID!;
const API_KEY = process.env.GOOGLE_AI_API_KEY!;

async function importMarkdownFiles() {
  const supabase = getAdminClient();

  const agentsDir = path.join(MPA_FOLDER, "agents");
  const commandsDir = path.join(MPA_FOLDER, "commands");

  const files: string[] = [];
  for (const dir of [agentsDir, commandsDir]) {
    try {
      const entries = await fs.readdir(dir);
      files.push(...entries.filter((f) => f.endsWith(".md")).map((f) => path.join(dir, f)));
    } catch {
      console.warn(`Pasta não encontrada: ${dir}`);
    }
  }

  console.log(`Encontrados ${files.length} arquivos para importar`);

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const content = await fs.readFile(filePath, "utf-8");

    if (!content.trim()) {
      console.log(`Pulando arquivo vazio: ${fileName}`);
      continue;
    }

    const title = fileName.replace(".md", "").replace(/-/g, " ");
    console.log(`Processando: ${title}`);

    // Criar documento
    const doc = await createDocument(supabase, {
      agent_id: AGENT_ID,
      organization_id: ORGANIZATION_ID,
      title,
      file_name: fileName,
      file_url: `local://${filePath}`,
      file_type: "md",
      file_size_bytes: Buffer.byteLength(content, "utf-8"),
      status: "processing",
    });

    // Chunkar e embedar
    const chunks = chunkText(content, 800, 100);
    const embeddings = await embedBatch(chunks, API_KEY);

    await insertChunks(supabase, chunks.map((c, idx) => ({
      document_id: doc.id,
      organization_id: ORGANIZATION_ID,
      content: c,
      metadata: { file_name: fileName, title, chunk_index: idx },
      embedding: embeddings[idx],
      chunk_index: idx,
    })));

    await updateDocument(supabase, doc.id, { status: "ready", chunk_count: chunks.length });
    console.log(`  → ${chunks.length} chunks inseridos`);
  }

  console.log("Importação concluída!");
}

importMarkdownFiles().catch(console.error);
```

- [ ] **Step 2: Adicionar script ao package.json raiz**

Editar `agente-crm/package.json`, adicionar em `scripts`:
```json
"import-mpa": "MPA_AGENT_ID=... ORGANIZATION_ID=... tsx scripts/import-mpa-knowledge.ts"
```

- [ ] **Step 3: Documentar como rodar**

Este script deve ser executado uma vez após criar o agente MPA no dashboard:
1. Criar o agente MPA pelo dashboard → copiar o `id` do agente
2. Pegar o `id` da organização no Supabase
3. Rodar: `MPA_AGENT_ID=<id> ORGANIZATION_ID=<id> pnpm import-mpa`

- [ ] **Step 4: Commit**

```bash
git add agente-crm/scripts/
git commit -m "feat: add script to import MPA markdown agents as knowledge base documents"
```

---

### Task 5: Verificação Final da Fase 5

- [ ] **Step 1: Typecheck**

```bash
cd crm-seguros && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 2: Testar fluxo completo no browser**

```bash
pnpm dev
```

Com API Fastify rodando:
1. Criar um agente MPA → deve aparecer na lista com badge "Assistente MPA"
2. Criar um agente de atendimento → badge "Atendimento"
3. Editar agente → alterações salvas
4. Abrir knowledge base → fazer upload de arquivo `.txt` com conteúdo de teste
5. Verificar no Supabase que o documento está com `status = 'processing'` e depois `ready`
6. Adicionar FAQ → aparece na lista

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "chore: fase 5 complete — WhatsApp agents dashboard with knowledge base"
```
