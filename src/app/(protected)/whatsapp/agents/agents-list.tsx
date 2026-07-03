"use client";

import { useState, useEffect } from "react";
import { Bot, Plus, Pencil, Trash2, FileText } from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";
import { waClient } from "@/lib/whatsapp-api-client";
import { AgentForm } from "./agent-form";
import { AgentKnowledge } from "./agent-knowledge";

type WaAgent = {
  id: string;
  name: string;
  description?: string;
  system_prompt: string;
  mode: "mpa" | "client_attendance";
  model: string;
  provider?: string;
  temperature?: number;
  max_tokens?: number;
  is_active: boolean;
  tools_config?: Record<string, boolean>;
};

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
      const data = await waClient.get<{ agents: WaAgent[] }>(
        `/agents?organization_id=${organizationId}`
      );
      setAgents(data.agents);
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const handleDelete = async (agentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este agente?")) return;
    try {
      await waClient.delete(`/agents/${agentId}`);
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
    } catch {
      alert("Erro ao excluir agente.");
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingAgent(null);
    fetchAgents();
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">Carregando agentes...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#2d1f4e" }}>
            Agentes de IA
          </h1>
          <p className="text-muted-foreground">Configure os assistentes do WhatsApp</p>
        </div>
        <button
          onClick={() => {
            setEditingAgent(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "#2d1f4e" }}
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
            onCancel={() => {
              setShowForm(false);
              setEditingAgent(null);
            }}
          />
        </div>
      )}

      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Bot className="mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium">Nenhum agente criado</p>
          <p className="text-sm text-muted-foreground">
            Crie um agente para começar a atender via WhatsApp
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-xl border bg-card shadow-sm">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      agent.mode === "mpa"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{agent.name}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          agent.mode === "mpa"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {agent.mode === "mpa" ? "Assistente NextIA" : "Atendimento"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          agent.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {agent.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setExpandedAgent(expandedAgent === agent.id ? null : agent.id)
                    }
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Base de conhecimento
                  </button>
                  <button
                    onClick={() => {
                      setEditingAgent(agent);
                      setShowForm(true);
                    }}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
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
