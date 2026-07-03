"use client";

import { useState, useEffect } from "react";
import { Phone, Save, CheckCircle } from "lucide-react";

type Member = {
  id: string;
  user_id: string;
  role: string;
  whatsapp_phone: string | null;
  users?: { email: string; raw_user_meta_data?: { name?: string; full_name?: string } } | null;
};

interface Props {
  organizationId: string;
}

export function CorretoresSection({ organizationId }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const res = await fetch(
        `/api/whatsapp/settings/members?organization_id=${organizationId}`
      );
      if (res.ok) {
        const data = (await res.json()) as { members: Member[] };
        setMembers(data.members);
        const initial: Record<string, string> = {};
        data.members.forEach((m) => {
          initial[m.id] = m.whatsapp_phone ?? "";
        });
        setPhones(initial);
      }
      setLoading(false);
    };
    fetchMembers();
  }, [organizationId]);

  const handleSavePhone = async (memberId: string) => {
    const phone = phones[memberId]?.replace(/\D/g, "") || null;
    await fetch(`/api/whatsapp/settings/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp_phone: phone }),
    });
    setSaved((p) => ({ ...p, [memberId]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [memberId]: false })), 3000);
  };

  const getMemberName = (m: Member): string => {
    const meta = m.users?.raw_user_meta_data;
    return (
      meta?.name ?? meta?.full_name ?? m.users?.email ?? `Usuário ${m.id.slice(0, 8)}`
    );
  };

  if (loading) {
    return <div className="text-sm text-gray-400">Carregando corretores...</div>;
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Phone className="h-5 w-5 text-gray-400" />
        <h2 className="text-base font-semibold">Telefones dos Corretores</h2>
      </div>
      <p className="mb-5 text-sm text-gray-500">
        Vincule o número de WhatsApp de cada corretor. Quando esse número enviar mensagem,
        o sistema reconhece como corretor e usa o modo NextIA.{" "}
        <code className="rounded bg-gray-100 px-1 text-xs">5511999990001</code>{" "}
        (código do país + DDD + número, apenas dígitos).
      </p>

      {members.length === 0 ? (
        <p className="text-sm text-gray-400">
          Nenhum membro encontrado na organização.
        </p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{getMemberName(member)}</p>
                <p className="text-xs capitalize text-gray-400">{member.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={phones[member.id] ?? ""}
                  onChange={(e) =>
                    setPhones((p) => ({ ...p, [member.id]: e.target.value }))
                  }
                  placeholder="5511999..."
                  className="w-36 rounded-lg border bg-white px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  onClick={() => handleSavePhone(member.id)}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                  style={{ backgroundColor: "#2d1f4e" }}
                >
                  {saved[member.id] ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saved[member.id] ? "Salvo!" : "Salvar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
