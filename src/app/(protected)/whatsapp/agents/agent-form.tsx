"use client";

import { useState } from "react";
import { waClient } from "@/lib/whatsapp-api-client";

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

interface Props {
  agent: WaAgent | null;
  organizationId: string;
  onSaved: () => void;
  onCancel: () => void;
}

const MPA_SYSTEM_PROMPT = `Você é o NextIA — assistente executiva da corretora.
Você conhece as 6 frentes de trabalho: Assistente, Clientes, Financeiro, Operadoras, Comercial e Marketing.
Seja direta, objetiva e prática. Responda como uma sócia experiente.
Consulte a base de conhecimento para informações específicas.`;

const ATTENDANCE_SYSTEM_PROMPT = `Você é a assistente de atendimento da corretora.
Seu objetivo é qualificar leads: entender a necessidade e coletar informações básicas.
Seja acolhedora e profissional. Nunca prometa valores ou coberturas sem confirmar.
Quando tiver nome e interesse do cliente, use a ferramenta createLead para registrar.`;

export function AgentForm({ agent, organizationId, onSaved, onCancel }: Props) {
  const isEditing = !!agent;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: agent?.name ?? "",
    description: agent?.description ?? "",
    system_prompt: agent?.system_prompt ?? MPA_SYSTEM_PROMPT,
    mode: agent?.mode ?? ("mpa" as "mpa" | "client_attendance"),
    model: agent?.model ?? "llama-3.3-70b-versatile",
    provider: agent?.provider ?? "groq",
    temperature: agent?.temperature ?? 0.7,
    max_tokens: agent?.max_tokens ?? 1024,
    is_active: agent?.is_active ?? true,
    tools_config: agent?.tools_config ?? {
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
      system_prompt:
        prev.system_prompt.length < 30
          ? mode === "mpa"
            ? MPA_SYSTEM_PROMPT
            : ATTENDANCE_SYSTEM_PROMPT
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
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-6 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold">
        {isEditing ? "Editar Agente" : "Novo Agente"}
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">Modo do Agente</label>
        <div className="flex gap-3">
          {(["mpa", "client_attendance"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleModeChange(mode)}
              className={`flex-1 rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                form.mode === mode
                  ? "border-purple-500 bg-purple-50 font-medium text-purple-700"
                  : "hover:border-gray-400"
              }`}
            >
              {mode === "mpa" ? "Assistente NextIA" : "Atendimento ao Cliente"}
              <p className="mt-1 text-xs font-normal text-gray-500">
                {mode === "mpa"
                  ? "Para corretores cadastrados"
                  : "Para clientes desconhecidos"}
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
            placeholder="Ex: NextIA da Andreia"
            required
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Modelo LLM</label>
          <select
            value={form.model}
            onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
            <option value="llama-3.1-8b-instant">Llama 3.1 8B (Groq, rápido)</option>
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
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium">
          Instruções do Sistema (System Prompt) *
        </label>
        <textarea
          value={form.system_prompt}
          onChange={(e) => setForm((p) => ({ ...p, system_prompt: e.target.value }))}
          rows={6}
          required
          className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Defina o comportamento e personalidade do agente.
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Temperatura: {form.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={form.temperature}
            onChange={(e) =>
              setForm((p) => ({ ...p, temperature: parseFloat(e.target.value) }))
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Preciso</span>
            <span>Criativo</span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Máx. tokens</label>
          <input
            type="number"
            value={form.max_tokens}
            onChange={(e) =>
              setForm((p) => ({ ...p, max_tokens: parseInt(e.target.value) }))
            }
            min="256"
            max="8192"
            step="256"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
        <label htmlFor="is_active" className="text-sm font-medium">
          Agente ativo
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "#2d1f4e" }}
        >
          {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar agente"}
        </button>
      </div>
    </form>
  );
}
