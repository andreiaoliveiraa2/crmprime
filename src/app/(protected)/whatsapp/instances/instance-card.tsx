"use client";

import { useState, useEffect, useRef } from "react";
import { Wifi, WifiOff, QrCode, Trash2, RefreshCw } from "lucide-react";

type AgentOption = { id: string; name: string; mode: string };

interface WaInstance {
  id: string;
  instance_name: string;
  status: "connected" | "disconnected" | "connecting";
  phone_number: string | null;
  active_agent_id: string | null;
}

interface Props {
  instance: WaInstance;
  agents: AgentOption[];
  onDeleted: () => void;
  onUpdated: () => void;
}

function StatusBadge({ status }: { status: WaInstance["status"] }) {
  const map = {
    connected: {
      Icon: Wifi,
      label: "Conectado",
      cls: "bg-green-100 text-green-700",
    },
    disconnected: {
      Icon: WifiOff,
      label: "Desconectado",
      cls: "bg-gray-100 text-gray-600",
    },
    connecting: {
      Icon: RefreshCw,
      label: "Conectando...",
      cls: "bg-yellow-100 text-yellow-700",
    },
  }[status];
  const { Icon, label, cls } = map;
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      <Icon className={`h-3 w-3 ${status === "connecting" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

export function InstanceCard({ instance, agents, onDeleted, onUpdated }: Props) {
  const [showQR, setShowQR] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(instance.active_agent_id ?? "");
  const [savingAgent, setSavingAgent] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQRCode = async () => {
    setLoadingQR(true);
    try {
      const res = await fetch(`/api/whatsapp/instances/${instance.id}/qrcode`);
      if (res.ok) {
        const data = (await res.json()) as { base64?: string };
        setQrBase64(data.base64 ?? null);
      } else {
        setQrBase64(null);
      }
    } catch {
      setQrBase64(null);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleConnectClick = async () => {
    setShowQR(true);
    await fetchQRCode();
    pollingRef.current = setInterval(fetchQRCode, 15000);
  };

  useEffect(() => {
    if (instance.status === "connected" && pollingRef.current) {
      clearInterval(pollingRef.current);
      setShowQR(false);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [instance.status]);

  const handleSaveAgent = async () => {
    setSavingAgent(true);
    await fetch(`/api/whatsapp/instances/${instance.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active_agent_id: selectedAgentId || null }),
    });
    setSavingAgent(false);
    onUpdated();
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Excluir instância "${instance.instance_name}"? Isso desconectará o WhatsApp.`
      )
    )
      return;
    await fetch(`/api/whatsapp/instances/${instance.id}`, { method: "DELETE" });
    onDeleted();
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{instance.instance_name}</h3>
              <StatusBadge status={instance.status} />
            </div>
            {instance.phone_number && (
              <p className="mt-0.5 text-sm text-gray-500">{instance.phone_number}</p>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-500">
            Agente ativo
          </label>
          <div className="flex gap-2">
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">Nenhum agente vinculado</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.mode === "mpa" ? "NextIA" : "Atendimento"})
                </option>
              ))}
            </select>
            <button
              onClick={handleSaveAgent}
              disabled={
                savingAgent || selectedAgentId === (instance.active_agent_id ?? "")
              }
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: "#2d1f4e" }}
            >
              {savingAgent ? "..." : "Salvar"}
            </button>
          </div>
        </div>

        {instance.status !== "connected" && (
          <div className="mt-4">
            {!showQR ? (
              <button
                onClick={handleConnectClick}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-3 text-sm text-gray-500 transition-all hover:border-purple-400 hover:text-purple-600"
              >
                <QrCode className="h-4 w-4" />
                Conectar WhatsApp (escanear QR code)
              </button>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border bg-gray-50 p-4">
                <p className="text-sm font-medium">Escaneie o QR code no WhatsApp</p>
                <p className="text-xs text-gray-400">
                  WhatsApp → Configurações → Dispositivos conectados
                </p>
                {loadingQR ? (
                  <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-gray-100">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : qrBase64 ? (
                  <img
                    src={`data:image/png;base64,${qrBase64}`}
                    alt="WhatsApp QR Code"
                    className="h-48 w-48 rounded-lg"
                  />
                ) : (
                  <div className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-lg border">
                    <QrCode className="h-8 w-8 text-gray-300" />
                    <p className="text-xs text-gray-400">QR code não disponível</p>
                    <button
                      onClick={fetchQRCode}
                      className="text-xs text-purple-600 underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Atualiza automaticamente a cada 15 segundos
                </p>
                <button
                  onClick={() => {
                    setShowQR(false);
                    if (pollingRef.current) clearInterval(pollingRef.current);
                  }}
                  className="text-xs text-gray-400 underline"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
