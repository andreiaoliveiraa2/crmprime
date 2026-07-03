"use client";

import { useState } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { ConversationList } from "./conversation-list";
import { ChatPanel } from "./chat-panel";

export function InboxLayout() {
  const { organizationId } = useOrganization();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!organizationId) {
    return <div className="p-6 text-gray-400">Carregando...</div>;
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Lista de conversas — esconde no mobile quando há conversa selecionada */}
      <div
        className={`flex-shrink-0 border-r bg-background ${
          selectedId ? "hidden md:flex md:w-80" : "w-full md:w-80"
        }`}
      >
        <ConversationList
          organizationId={organizationId}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* Painel de chat */}
      <div
        className={`flex-1 overflow-hidden ${
          !selectedId ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedId ? (
          <ChatPanel
            conversationId={selectedId}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
            <p className="text-sm">Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
