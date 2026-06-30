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

type RealtimePayload = {
  eventType: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

export function useWaRealtime(
  table: string,
  filter: string | null,
  callback: (payload: RealtimePayload) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const supabase = getBrowserClient();
    const channelName = `wa-${table}-${filter ?? "all"}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        filter
          ? { event: "*", schema: "public", table, filter }
          : { event: "*", schema: "public", table },
        (payload: RealtimePayload) => callbackRef.current(payload)
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}

export function useConversationMessages(
  conversationId: string | null,
  onNewMessage: () => void
) {
  useWaRealtime(
    "wa_messages",
    conversationId ? `conversation_id=eq.${conversationId}` : null,
    (payload) => {
      if (payload.eventType === "INSERT") onNewMessage();
    }
  );
}

export function useConversationListRealtime(
  organizationId: string | null,
  onUpdate: () => void
) {
  useWaRealtime(
    "wa_conversations",
    organizationId ? `organization_id=eq.${organizationId}` : null,
    () => onUpdate()
  );
}
