"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Bot } from "lucide-react";
import { useConversationListRealtime } from "@/hooks/use-wa-realtime";

type ConversationItem = {
  id: string;
  mode: "mpa" | "client_attendance";
  status: "open" | "waiting" | "resolved" | "closed";
  is_human_takeover: boolean;
  last_message_at: string;
  wa_contacts: { phone: string; name: string | null };
};

type StatusFilter = "all" | "open" | "waiting" | "resolved";
type ModeFilter = "all" | "mpa" | "client_attendance";

interface Props {
  organizationId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  if (diff < 60000) return "agora";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

export function ConversationList({ organizationId, selectedId, onSelect }: Props) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [search, setSearch] = useState("");

  const fetchConversations = useCallback(async () => {
    const params = new URLSearchParams({ organization_id: organizationId });
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/whatsapp/conversations?${params}`);
    if (res.ok) {
      const data = (await res.json()) as { conversations: ConversationItem[] };
      setConversations(data.conversations);
    }
    setLoading(false);
  }, [organizationId, statusFilter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useConversationListRealtime(organizationId, fetchConversations);

  const filtered = conversations.filter((c) => {
    if (modeFilter !== "all" && c.mode !== modeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.wa_contacts.phone.includes(q) ||
        (c.wa_contacts.name?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="flex w-full flex-col overflow-hidden">
      {/* Header com filtros */}
      <div className="border-b p-3">
        <h2 className="mb-2 text-base font-semibold" style={{ color: "#2d1f4e" }}>
          Inbox
        </h2>
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
        />
        <div className="flex flex-wrap gap-1">
          {(["all", "open", "waiting", "resolved"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-all ${
                statusFilter === s
                  ? "text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              style={statusFilter === s ? { backgroundColor: "#2d1f4e" } : undefined}
            >
              {s === "all"
                ? "Todas"
                : s === "open"
                ? "Abertas"
                : s === "waiting"
                ? "Aguardando"
                : "Resolvidas"}
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1">
          {(["all", "mpa", "client_attendance"] as ModeFilter[]).map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-all ${
                modeFilter === m
                  ? "text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              style={modeFilter === m ? { backgroundColor: "#b89a6a" } : undefined}
            >
              {m === "all" ? "Todos" : m === "mpa" ? "NextIA" : "Atendimento"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center p-8 text-center text-gray-400">
            <MessageSquare className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const contact = conv.wa_contacts;
            const displayName = contact.name || contact.phone;
            const initials = displayName.slice(0, 2).toUpperCase();
            const isMpa = conv.mode === "mpa";

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`flex w-full items-start gap-3 border-b p-3 text-left transition-colors hover:bg-gray-50 ${
                  selectedId === conv.id
                    ? "border-l-2 bg-purple-50"
                    : ""
                }`}
                style={selectedId === conv.id ? { borderLeftColor: "#2d1f4e" } : undefined}
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    isMpa
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      {timeAgo(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {isMpa ? (
                      <Bot className="h-3 w-3 text-purple-400" />
                    ) : (
                      <MessageSquare className="h-3 w-3 text-blue-400" />
                    )}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs ${
                        conv.status === "open"
                          ? "bg-green-100 text-green-700"
                          : conv.status === "waiting"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {conv.status === "open"
                        ? "Aberta"
                        : conv.status === "waiting"
                        ? "Aguardando"
                        : conv.status === "resolved"
                        ? "Resolvida"
                        : "Fechada"}
                    </span>
                    {conv.is_human_takeover && (
                      <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                        Humano
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
