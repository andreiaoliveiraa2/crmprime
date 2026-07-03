import { Bot, MessageSquare, Wifi, Settings } from "lucide-react";
import Link from "next/link";

export default function WhatsAppPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold" style={{ color: '#2d1f4e' }}>Agente WhatsApp</h1>
        <p className="mt-2 text-gray-500">
          Gerencie seu assistente de IA integrado ao WhatsApp
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/whatsapp/inbox",     icon: MessageSquare, label: "Inbox",       desc: "Conversas em tempo real"        },
          { href: "/whatsapp/agents",    icon: Bot,           label: "Agentes",     desc: "Configure os assistentes de IA" },
          { href: "/whatsapp/instances", icon: Wifi,          label: "Instâncias",  desc: "Gerencie conexões WhatsApp"     },
          { href: "/whatsapp/settings",  icon: Settings,      label: "Configurações", desc: "API keys e preferências"      },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-3 rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md"
            style={{ borderColor: 'rgba(45,31,78,0.15)' }}
          >
            <Icon className="h-8 w-8" style={{ color: '#b89a6a' }} />
            <div className="text-center">
              <p className="font-semibold" style={{ color: '#2d1f4e' }}>{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
