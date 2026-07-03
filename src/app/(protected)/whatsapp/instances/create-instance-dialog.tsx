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
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Erro ao criar instância");
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
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
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
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Apenas letras, números e hífens. Será convertido para minúsculas.
            </p>
          </div>

          <div className="mb-6 rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">
              <strong>Próximo passo:</strong> Após criar, você precisará escanear um QR code
              para conectar o número do WhatsApp.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !instanceName.trim()}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "#2d1f4e" }}
            >
              {loading ? "Criando..." : "Criar instância"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
