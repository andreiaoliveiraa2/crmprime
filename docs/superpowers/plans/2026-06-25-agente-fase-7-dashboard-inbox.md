# Fase 7: Dashboard Inbox — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a página `/whatsapp/inbox` com lista de conversas em tempo real (Supabase Realtime), painel de chat, controle de takeover humano, notas internas, tags, e link com lead do CRM.

**Architecture:** Layout de dois painéis: lista de conversas à esquerda (com filtros por status e modo), painel de chat à direita. Ambos são Client Components com Supabase Realtime para updates ao vivo. Takeover human: botão que muda `is_human_takeover = true` e permite envio de mensagens pelo agente humano.

**Tech Stack:** Next.js 16.2.6, React 19, Tailwind CSS 4, lucide-react, Supabase Realtime

## Global Constraints

- Pasta: `crm-seguros/src/app/(dashboard)/whatsapp/inbox/`
- Pré-requisito: Fases 2, 4 concluídas
- Realtime via hooks `useWaRealtime` e `useConversationMessages` (Fase 4)
- Takeover humano: `PATCH /api/whatsapp/conversations/:id` com `{ is_human_takeover: true }`
- Envio de mensagem pelo humano: `POST /api/whatsapp/messages/send`
- Todas as conversas retornam com join de `wa_contacts` (nome + telefone)

---

### Task 1: Layout do Inbox com Dois Painéis

**Files:**
- Modify: `crm-seguros/src/app/(dashboard)/whatsapp/inbox/page.tsx`
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/inbox/inbox-layout.tsx`
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/inbox/conversation-list.tsx`
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/inbox/chat-panel.tsx`

**Interfaces:**
- Produces: layout responsivo de dois painéis com estado de conversa selecionada

- [ ] **Step 1: Criar InboxLayout**

Criar `crm-seguros/src/app/(dashboard)/whatsapp/inbox/inbox-layout.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { ConversationList } from "./conversation-list";
import { ChatPanel } from "./chat-panel";

export function InboxLayout() {
  const { organizationId } = useOrganization();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  if (!organizationId) return <div className="p-6 text-muted-foreground">Carregando...</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Lista de conversas */}
      <div className={`flex-shrink-0 border-r bg-background ${selectedConversationId ? "hidden md:flex md:w-80" : "w-full md:w-80"}`}>
        <ConversationList
          organizationId={organizationId}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
        />
      </div>

      {/* Painel de chat */}
      <div className={`flex-1 overflow-hidden ${!selectedConversationId ? "hidden md:flex" : "flex"}`}>
        {selectedConversationId ? (
          <ChatPanel
            conversationId={selectedConversationId}
            onBack={() => setSelectedConversationId(null)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Atualizar page.tsx**

Substituir `crm-seguros/src/app/(dashboard)/whatsapp/inbox/page.tsx`:
```tsx
import { InboxLayout } from "./inbox-layout";

export default function InboxPage() {
  return <InboxLayout />;
}
```

- [ ] **Step 3: Verificar typecheck**

```bash
cd crm-seguros && pnpm typecheck
```

(Vai ter erros de imports para ConversationList e ChatPanel que ainda não existem — normal neste passo)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add inbox two-panel layout with conversation selection"
```

---

### Task 2: Lista de Conversas com Filtros e Realtime

**Files:**
- Modify: `crm-seguros/src/app/(dashboard)/whatsapp/inbox/conversation-list.tsx`

**Interfaces:**
- Consumes: `GET /api/whatsapp/conversations?organization_id=...&status=...`
- Produces: lista filtrada de conversas com avatar, nome, última mensagem, badges de status e modo

- [ ] **Step 1: Criar ConversationList com filtros e realtime**

Criar `crm-seguros/src/app/(dashboard)/whatsapp/inbox/conversation-list.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Bot, User, Clock } from "lucide-react";
import { useConversationListRealtime } from "@/hooks/use-wa-realtime";
import type { WaConversation } from "@agente-crm/shared";

interface ConversationWithContact extends WaConversation {
  wa_contacts: { phone: string; name: string | null; photo_url: string | null };
  wa_agents?: { name: string; mode: string } | null;
  last_message?: { content: string; role: string } | null;
}

type StatusFilter = "all" | "open" | "waiting" | "resolved";
type ModeFilter = "all" | "mpa" | "client_attendance";

interface Props {
  organizationId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function ConversationItem({ conv, isSelected, onClick }: {
  conv: ConversationWithContact;
  isSelected: boolean;
  onClick: () => void;
}) {
  const contact = conv.wa_contacts;
  const displayName = contact.name || contact.phone;
  const initials = displayName.slice(0, 2).toUpperCase();
  const isHuman = conv.is_human_takeover;
  const isMpa = conv.mode === "mpa";

  const timeAgo = (isoDate: string) => {
    const diff = Date.now() - new Date(isoDate).getTime();
    if (diff < 60000) return "agora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 border-b p-3 text-left transition-colors hover:bg-muted/50 ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
    >
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${isMpa ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <span className="flex-shrink-0 text-xs text-muted-foreground">{timeAgo(conv.last_message_at)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          {isMpa ? <Bot className="h-3 w-3 text-purple-500" /> : <MessageSquare className="h-3 w-3 text-blue-500" />}
          {isHuman && <User className="h-3 w-3 text-orange-500" />}
          <span className={`rounded-full px-1.5 py-0.5 text-xs ${
            conv.status === "open" ? "bg-green-100 text-green-700" :
            conv.status === "waiting" ? "bg-yellow-100 text-yellow-700" :
            "bg-gray-100 text-gray-500"
          }`}>
            {conv.status === "open" ? "Aberta" : conv.status === "waiting" ? "Aguardando" : conv.status === "resolved" ? "Resolvida" : "Fechada"}
          </span>
          {isHuman && <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">Humano</span>}
        </div>
      </div>
    </button>
  );
}

export function ConversationList({ organizationId, selectedId, onSelect }: Props) {
  const [conversations, setConversations] = useState<ConversationWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [search, setSearch] = useState("");

  const fetchConversations = async () => {
    const params = new URLSearchParams({ organization_id: organizationId });
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/whatsapp/conversations?${params}`);
    if (res.ok) {
      const data = await res.json() as { conversations: ConversationWithContact[] };
      setConversations(data.conversations);
    }
    setLoading(false);
  };

  useEffect(() => { fetchConversations(); }, [organizationId, statusFilter]);

  useConversationListRealtime(organizationId, fetchConversations);

  const filtered = conversations.filter((c) => {
    if (modeFilter !== "all" && c.mode !== modeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.wa_contacts.phone.includes(q) || (c.wa_contacts.name?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  return (
    <div className="flex w-full flex-col">
      {/* Header */}
      <div className="border-b p-3">
        <h2 className="mb-2 text-base font-semibold">Inbox</h2>
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex gap-1">
          {(["all", "open", "waiting", "resolved"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-all ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {s === "all" ? "Todas" : s === "open" ? "Abertas" : s === "waiting" ? "Aguardando" : "Resolvidas"}
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1">
          {(["all", "mpa", "client_attendance"] as ModeFilter[]).map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-all ${modeFilter === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {m === "all" ? "Todos" : m === "mpa" ? "MPA" : "Atendimento"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center p-8 text-center text-muted-foreground">
            <MessageSquare className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar rota BFF para conversas**

Criar `crm-seguros/src/app/api/whatsapp/conversations/route.ts`:
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
  const res = await fetch(`${process.env.WA_API_URL}/conversations?${req.nextUrl.searchParams}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}
```

Criar `crm-seguros/src/app/api/whatsapp/conversations/[id]/route.ts`:
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
  const res = await fetch(`${process.env.WA_API_URL}/conversations/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: await req.text(),
  });
  return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}
```

- [ ] **Step 3: Criar rota BFF para messages**

Criar `crm-seguros/src/app/api/whatsapp/messages/route.ts`:
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
  const conversationId = req.nextUrl.searchParams.get("conversation_id");
  const { createClient } = await import("@supabase/supabase-js");
  const adminSupabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await adminSupabase
    .from("wa_messages")
    .select("*")
    .eq("conversation_id", conversationId!)
    .order("created_at", { ascending: true });
  return NextResponse.json({ messages: data });
}

export async function POST(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${process.env.WA_API_URL}/messages/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: await req.text(),
  });
  return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}
```

- [ ] **Step 4: Verificar typecheck**

```bash
cd crm-seguros && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add conversation list with filters, search, and realtime updates"
```

---

### Task 3: Painel de Chat com Takeover e Notas

**Files:**
- Modify: `crm-seguros/src/app/(dashboard)/whatsapp/inbox/chat-panel.tsx`

**Interfaces:**
- Consumes: `conversationId`, `GET /api/whatsapp/conversations/:id`, `GET /api/whatsapp/messages?conversation_id=...`, `POST /api/whatsapp/messages` (send), `PATCH /api/whatsapp/conversations/:id` (takeover/status/tags)
- Produces: painel de chat completo com scroll automático, input de mensagem (só disponível em takeover), botão de takeover, notas, status badge, link para lead

- [ ] **Step 1: Criar ChatPanel**

Criar `crm-seguros/src/app/(dashboard)/whatsapp/inbox/chat-panel.tsx`:
```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, User, Bot, Send, Tag, FileText, UserCheck, UserX, ExternalLink, ChevronDown } from "lucide-react";
import { useConversationMessages } from "@/hooks/use-wa-realtime";
import type { WaMessage } from "@agente-crm/shared";

interface ConversationDetail {
  id: string;
  mode: "mpa" | "client_attendance";
  status: string;
  is_human_takeover: boolean;
  tags: string[];
  last_message_at: string;
  wa_contacts: { id: string; phone: string; name: string | null; lead_id: string | null };
  wa_agents: { name: string; mode: string } | null;
}

interface Props {
  conversationId: string;
  onBack: () => void;
}

function MessageBubble({ message }: { message: WaMessage }) {
  const isContact = message.role === "contact";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`flex ${isContact ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
        isContact ? "bg-muted text-foreground rounded-tl-sm" :
        message.role === "human_agent" ? "bg-orange-500 text-white rounded-tr-sm" :
        "bg-primary text-primary-foreground rounded-tr-sm"
      }`}>
        {message.role === "human_agent" && (
          <p className="mb-1 text-xs opacity-80">Você</p>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={`mt-1 text-right text-xs opacity-60`}>
          {new Date(message.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export function ChatPanel({ conversationId, onBack }: Props) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversation = async () => {
    const res = await fetch(`/api/whatsapp/conversations/${conversationId}`);
    if (res.ok) setConversation((await res.json() as { conversation: ConversationDetail }).conversation);
  };

  const fetchMessages = async () => {
    const res = await fetch(`/api/whatsapp/messages?conversation_id=${conversationId}`);
    if (res.ok) setMessages((await res.json() as { messages: WaMessage[] }).messages);
  };

  useEffect(() => {
    fetchConversation();
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useConversationMessages(conversationId, fetchMessages);

  const handleTakeover = async (takeover: boolean) => {
    await fetch(`/api/whatsapp/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_human_takeover: takeover,
        ...(takeover ? {} : { status: "open" }),
      }),
    });
    fetchConversation();
  };

  const handleStatusChange = async (status: string) => {
    await fetch(`/api/whatsapp/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchConversation();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !conversation?.is_human_takeover) return;
    setSending(true);
    await fetch("/api/whatsapp/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId, content: messageText.trim() }),
    });
    setMessageText("");
    setSending(false);
    fetchMessages();
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || !conversation) return;
    const tags = [...conversation.tags, newTag.trim()];
    await fetch(`/api/whatsapp/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    setNewTag("");
    fetchConversation();
  };

  const handleRemoveTag = async (tag: string) => {
    if (!conversation) return;
    const tags = conversation.tags.filter((t) => t !== tag);
    await fetch(`/api/whatsapp/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    fetchConversation();
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await fetch(`/api/whatsapp/conversations/${conversationId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteText.trim() }),
    });
    setNoteText("");
    setShowNoteInput(false);
  };

  if (!conversation) return <div className="flex flex-1 items-center justify-center text-muted-foreground">Carregando...</div>;

  const contact = conversation.wa_contacts;
  const isHuman = conversation.is_human_takeover;
  const isMpa = conversation.mode === "mpa";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
        <button onClick={onBack} className="rounded-lg p-1.5 hover:bg-muted md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{contact.name || contact.phone}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs ${isMpa ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
              {isMpa ? "MPA" : "Atendimento"}
            </span>
            {isHuman && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">Humano</span>}
          </div>
          <p className="text-xs text-muted-foreground">{contact.phone}</p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1.5">
          {contact.lead_id && (
            <a href={`/leads/${contact.lead_id}`} target="_blank" className="rounded-lg p-2 text-muted-foreground hover:bg-muted" title="Ver lead no CRM">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            title="Adicionar nota"
          >
            <FileText className="h-4 w-4" />
          </button>

          {!isHuman ? (
            <button
              onClick={() => handleTakeover(true)}
              className="flex items-center gap-1.5 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-200"
              title="Assumir atendimento"
            >
              <UserCheck className="h-4 w-4" />
              Assumir
            </button>
          ) : (
            <button
              onClick={() => handleTakeover(false)}
              className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200"
              title="Devolver ao bot"
            >
              <Bot className="h-4 w-4" />
              Devolver ao bot
            </button>
          )}

          <select
            value={conversation.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border bg-background px-2 py-1.5 text-xs"
          >
            <option value="open">Aberta</option>
            <option value="waiting">Aguardando</option>
            <option value="resolved">Resolvida</option>
            <option value="closed">Fechada</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      {(conversation.tags.length > 0 || newTag !== undefined) && (
        <div className="flex flex-wrap items-center gap-1.5 border-b px-4 py-2">
          {conversation.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="text-muted-foreground hover:text-destructive">×</button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              placeholder="+ tag"
              className="w-16 rounded-full border bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Nota input */}
      {showNoteInput && (
        <div className="border-b bg-yellow-50 px-4 py-2">
          <p className="mb-1.5 text-xs font-medium text-yellow-800">Nota interna (não enviada ao cliente)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escreva sua nota..."
              className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm"
            />
            <button onClick={handleAddNote} className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600">Salvar</button>
          </div>
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensagem */}
      <div className="border-t bg-background p-3">
        {isHuman ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 rounded-xl border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              className="rounded-xl bg-primary p-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4" />
            <span>Bot em controle — clique em "Assumir" para enviar mensagens</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar rota BFF para conversation by ID e notes**

Criar `crm-seguros/src/app/api/whatsapp/conversations/[id]/route.ts` (já criada na Task 2, verificar se existe).

Criar `crm-seguros/src/app/api/whatsapp/conversations/[id]/notes/route.ts`:
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await fetch(`${process.env.WA_API_URL}/conversations/${id}/notes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: await req.text(),
  });
  return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}
```

- [ ] **Step 3: Adicionar endpoint de conversation by ID no Fastify**

Editar `agente-crm/apps/api/src/routes/conversations/index.ts`, adicionar GET por ID:
```typescript
app.get("/conversations/:id", { preHandler: requireAuth }, async (request, reply) => {
  const { id } = request.params as { id: string };
  const conversation = await getConversationById(supabaseAdmin, id);
  return reply.send({ conversation });
});
```

E adicionar conversas com filtro na rota GET existente. Editar para suportar `GET /conversations?organization_id=&status=`:
```typescript
app.get("/conversations", { preHandler: requireAuth }, async (request, reply) => {
  const { organization_id, status } = request.query as { organization_id: string; status?: string };
  if (!organization_id) return reply.code(400).send({ error: "organization_id required" });
  const conversations = await getConversationsByOrganization(supabaseAdmin, organization_id, status);
  return reply.send({ conversations });
});
```

- [ ] **Step 4: Verificar typecheck**

```bash
cd crm-seguros && pnpm typecheck
cd ../Desktop/agente-crm && pnpm typecheck
```

Expected: sem erros em ambos os projetos.

- [ ] **Step 5: Testar no browser**

```bash
cd crm-seguros && pnpm dev
```

Com sistema rodando (API + Worker + Redis):
1. Navegar para `/whatsapp/inbox`
2. Com dados de teste (Fase 3, Step 3): deve aparecer conversa na lista
3. Clicar na conversa → chat panel exibe mensagens
4. Clicar "Assumir" → badge "Humano" aparece, input de mensagem é ativado
5. Enviar mensagem → aparece como bubble laranja
6. Clicar "Devolver ao bot" → bot retoma controle
7. Adicionar tag → aparece no header
8. Adicionar nota → sem envio ao cliente

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add full inbox chat panel with takeover, notes, and tags"
```

---

### Task 4: Verificação Final da Fase 7

- [ ] **Step 1: Typecheck completo**

```bash
cd crm-seguros && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 2: Build**

```bash
pnpm build
```

Expected: build sem erros.

- [ ] **Step 3: Testar fluxo completo end-to-end**

Com Evolution API configurada e instância conectada:
1. Enviar mensagem de número desconhecido → aparece como "Atendimento" no inbox
2. Enviar mensagem de número de corretor cadastrado → aparece como "MPA" no inbox
3. Bot responde automaticamente (workers rodando)
4. Humano assume → envia mensagem manual via inbox
5. Humano devolve ao bot → bot retoma

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore: fase 7 complete — WhatsApp inbox with realtime chat and human takeover"
```
