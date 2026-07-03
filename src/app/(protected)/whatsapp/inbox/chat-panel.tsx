"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Bot,
  Send,
  FileText,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import { useConversationMessages } from "@/hooks/use-wa-realtime";

type MessageRole = "contact" | "agent" | "human_agent" | "system";

type WaMessage = {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
};

type ConversationDetail = {
  id: string;
  mode: "mpa" | "client_attendance";
  status: "open" | "waiting" | "resolved" | "closed";
  is_human_takeover: boolean;
  tags: string[];
  wa_contacts: { id: string; phone: string; name: string | null; lead_id: string | null };
  wa_agents: { name: string; mode: string } | null;
};

interface Props {
  conversationId: string;
  onBack: () => void;
}

function MessageBubble({ message }: { message: WaMessage }) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
          {message.content}
        </span>
      </div>
    );
  }

  const isContact = message.role === "contact";
  const isHuman = message.role === "human_agent";

  return (
    <div className={`flex ${isContact ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
          isContact
            ? "rounded-tl-sm bg-gray-100 text-gray-900"
            : isHuman
            ? "rounded-tr-sm bg-orange-500 text-white"
            : "rounded-tr-sm text-white"
        }`}
        style={!isContact && !isHuman ? { backgroundColor: "#2d1f4e" } : undefined}
      >
        {isHuman && <p className="mb-1 text-xs opacity-80">Você</p>}
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className="mt-1 text-right text-xs opacity-60">
          {new Date(message.created_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
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

  const fetchConversation = useCallback(async () => {
    const res = await fetch(`/api/whatsapp/conversations/${conversationId}`);
    if (res.ok) {
      const data = (await res.json()) as { conversation: ConversationDetail };
      setConversation(data.conversation);
    }
  }, [conversationId]);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(
      `/api/whatsapp/messages?conversation_id=${conversationId}`
    );
    if (res.ok) {
      const data = (await res.json()) as { messages: WaMessage[] };
      setMessages(data.messages);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversation();
    fetchMessages();
  }, [fetchConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useConversationMessages(conversationId, fetchMessages);

  const patchConversation = async (body: Record<string, unknown>) => {
    await fetch(`/api/whatsapp/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    fetchConversation();
  };

  const handleTakeover = (takeover: boolean) =>
    patchConversation({ is_human_takeover: takeover });

  const handleStatusChange = (status: string) => patchConversation({ status });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !conversation?.is_human_takeover) return;
    setSending(true);
    await fetch("/api/whatsapp/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: conversationId,
        content: messageText.trim(),
      }),
    });
    setMessageText("");
    setSending(false);
    fetchMessages();
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || !conversation) return;
    await patchConversation({ tags: [...conversation.tags, newTag.trim()] });
    setNewTag("");
  };

  const handleRemoveTag = (tag: string) => {
    if (!conversation) return;
    patchConversation({ tags: conversation.tags.filter((t) => t !== tag) });
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

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        Carregando...
      </div>
    );
  }

  const contact = conversation.wa_contacts;
  const isHuman = conversation.is_human_takeover;
  const isMpa = conversation.mode === "mpa";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 hover:bg-muted md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">
              {contact.name || contact.phone}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                isMpa
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {isMpa ? "NextIA" : "Atendimento"}
            </span>
            {isHuman && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                Humano
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">{contact.phone}</p>
        </div>

        <div className="flex items-center gap-1.5">
          {contact.lead_id && (
            <a
              href={`/leads/${contact.lead_id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-2 text-gray-400 hover:bg-muted"
              title="Ver lead no CRM"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            className="rounded-lg p-2 text-gray-400 hover:bg-muted"
            title="Adicionar nota"
          >
            <FileText className="h-4 w-4" />
          </button>

          {!isHuman ? (
            <button
              onClick={() => handleTakeover(true)}
              className="flex items-center gap-1.5 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-200"
            >
              <UserCheck className="h-4 w-4" />
              Assumir
            </button>
          ) : (
            <button
              onClick={() => handleTakeover(false)}
              className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200"
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
      <div className="flex flex-wrap items-center gap-1.5 border-b px-4 py-2">
        {conversation.tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs"
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="text-gray-400 hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
          placeholder="+ tag"
          className="w-16 rounded-full border bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
        />
      </div>

      {/* Nota interna */}
      {showNoteInput && (
        <div className="border-b bg-yellow-50 px-4 py-2">
          <p className="mb-1.5 text-xs font-medium text-yellow-800">
            Nota interna (não enviada ao cliente)
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escreva sua nota..."
              className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleAddNote}
              className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-background p-3">
        {isHuman ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 rounded-xl border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              className="rounded-xl p-2.5 text-white disabled:opacity-40"
              style={{ backgroundColor: "#2d1f4e" }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Bot className="h-4 w-4" />
            <span>Bot em controle — clique em &ldquo;Assumir&rdquo; para enviar mensagens</span>
          </div>
        )}
      </div>
    </div>
  );
}
