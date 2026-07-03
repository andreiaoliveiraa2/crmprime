"use client";

import { useState, useEffect } from "react";
import { Plus, Wifi } from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";
import { useWaRealtime } from "@/hooks/use-wa-realtime";
import { InstanceCard } from "./instance-card";
import { CreateInstanceDialog } from "./create-instance-dialog";

type AgentOption = { id: string; name: string; mode: string };

type WaInstance = {
  id: string;
  instance_name: string;
  status: "connected" | "disconnected" | "connecting";
  phone_number: string | null;
  active_agent_id: string | null;
};

export function InstancesList() {
  const { organizationId } = useOrganization();
  const [instances, setInstances] = useState<WaInstance[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
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
      if (instRes.ok) {
        setInstances(
          ((await instRes.json()) as { instances: WaInstance[] }).instances
        );
      }
      if (agentsRes.ok) {
        setAgents(
          ((await agentsRes.json()) as { agents: AgentOption[] }).agents
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

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
      if (payload.eventType === "INSERT") {
        fetchData();
      }
      if (payload.eventType === "DELETE") {
        setInstances((prev) =>
          prev.filter((inst) => inst.id !== (payload.old as { id: string }).id)
        );
      }
    }
  );

  if (loading) {
    return <div className="p-6 text-gray-400">Carregando instâncias...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#2d1f4e" }}>
            Instâncias WhatsApp
          </h1>
          <p className="text-gray-500">Gerencie conexões via Evolution API</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "#2d1f4e" }}
        >
          <Plus className="h-4 w-4" />
          Nova Instância
        </button>
      </div>

      {showCreate && organizationId && (
        <CreateInstanceDialog
          organizationId={organizationId}
          onCreated={() => {
            setShowCreate(false);
            fetchData();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Wifi className="mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium">Nenhuma instância criada</p>
          <p className="text-sm text-gray-400">
            Crie uma instância para conectar seu número do WhatsApp
          </p>
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
