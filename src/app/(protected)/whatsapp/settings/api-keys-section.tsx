"use client";

import { useState } from "react";
import { Key, Eye, EyeOff, CheckCircle } from "lucide-react";

interface Props {
  organizationId: string;
}

type Provider = "groq" | "google" | "openai";

export function ApiKeysSection({ organizationId }: Props) {
  const [keys, setKeys] = useState<Record<Provider, string>>({
    groq: "",
    google: "",
    openai: "",
  });
  const [showKey, setShowKey] = useState<Record<Provider, boolean>>({
    groq: false,
    google: false,
    openai: false,
  });
  const [saved, setSaved] = useState<Record<Provider, boolean>>({
    groq: false,
    google: false,
    openai: false,
  });
  const [saving, setSaving] = useState<Provider | null>(null);

  const handleSave = async (provider: Provider) => {
    if (!keys[provider].trim()) return;
    setSaving(provider);
    await fetch("/api/whatsapp/settings/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_id: organizationId,
        provider,
        encrypted_key: keys[provider].trim(),
      }),
    });
    setSaving(null);
    setSaved((p) => ({ ...p, [provider]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [provider]: false })), 3000);
  };

  const providers: {
    id: Provider;
    label: string;
    hint: string;
    placeholder: string;
    badge?: string;
  }[] = [
    {
      id: "groq",
      label: "Groq (LLM principal)",
      hint: "Modelo Llama 3.3 70B — padrão do sistema. Obtenha em console.groq.com",
      placeholder: "gsk_...",
      badge: "Em uso",
    },
    {
      id: "google",
      label: "Google AI (Embeddings)",
      hint: "Necessário para busca semântica na knowledge base (text-embedding-004)",
      placeholder: "AIza...",
    },
    {
      id: "openai",
      label: "OpenAI (opcional)",
      hint: "Alternativa de LLM para agentes específicos",
      placeholder: "sk-...",
    },
  ];

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Key className="h-5 w-5 text-gray-400" />
        <h2 className="text-base font-semibold">Chaves de API</h2>
      </div>
      <p className="mb-5 text-sm text-gray-500">
        Configure as chaves de API dos provedores de IA. As chaves são armazenadas de forma
        segura no banco de dados por organização.
      </p>

      <div className="space-y-4">
        {providers.map(({ id, label, hint, placeholder, badge }) => (
          <div key={id} className="rounded-lg border bg-gray-50 p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">{label}</label>
              {badge && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  {badge}
                </span>
              )}
            </div>
            <p className="mb-2 text-xs text-gray-400">{hint}</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey[id] ? "text" : "password"}
                  value={keys[id]}
                  onChange={(e) => setKeys((p) => ({ ...p, [id]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-lg border bg-white px-3 py-2 pr-10 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((p) => ({ ...p, [id]: !p[id] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showKey[id] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <button
                onClick={() => handleSave(id)}
                disabled={saving === id || !keys[id].trim()}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                style={{ backgroundColor: "#2d1f4e" }}
              >
                {saved[id] ? (
                  <>
                    <CheckCircle className="h-4 w-4" /> Salvo
                  </>
                ) : saving === id ? (
                  "..."
                ) : (
                  "Salvar"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
