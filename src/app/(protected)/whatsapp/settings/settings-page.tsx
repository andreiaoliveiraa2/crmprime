"use client";

import { useOrganization } from "@/hooks/use-organization";
import { ApiKeysSection } from "./api-keys-section";
import { CorretoresSection } from "./corretores-section";

export function SettingsPage() {
  const { organizationId, loading } = useOrganization();

  if (loading) {
    return <div className="p-6 text-gray-400">Carregando...</div>;
  }
  if (!organizationId) {
    return (
      <div className="p-6 text-gray-400">
        Organização não encontrada. Configure no banco de dados.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#2d1f4e" }}>
          Configurações WhatsApp
        </h1>
        <p className="text-gray-500">API keys e mapeamento de corretores</p>
      </div>
      <div className="max-w-2xl space-y-6">
        <ApiKeysSection organizationId={organizationId} />
        <CorretoresSection organizationId={organizationId} />
      </div>
    </div>
  );
}
