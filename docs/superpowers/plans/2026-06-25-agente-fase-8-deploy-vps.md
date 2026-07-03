# Fase 8: Configurações e Deploy VPS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a página `/whatsapp/settings` (API keys de LLM, mapeamento de telefones de corretores) e fazer o deploy do `agente-crm` na mesma VPS onde o `crm-seguros` já roda, usando Docker Compose com Nginx como reverse proxy.

**Architecture:** Deploy VPS: a mesma VPS do `crm-seguros` recebe o `agente-crm` em um diretório separado. Nginx faz proxy de `api.seudominio.com` → `localhost:3001` (Fastify). O `crm-seguros` já tem seu próprio Nginx/processo Node. Docker Compose sobe API + Worker + Redis em containers. As variáveis de ambiente ficam num `.env` de produção na VPS.

**Tech Stack:** Next.js 16.2.6 (settings page), Docker Compose, Nginx, Node 20

## Global Constraints

- Pasta settings: `crm-seguros/src/app/(dashboard)/whatsapp/settings/`
- Deploy: VPS existente (mesmo servidor do `crm-seguros`)
- Porta da API Fastify em produção: `3001` (sem expor externamente — proxiado pelo Nginx)
- Redis: container Docker, porta `6379` interna apenas
- `WA_API_URL` no `crm-seguros`: `http://localhost:3001` (requisição interna à VPS)
- `API_PUBLIC_URL` no `agente-crm/.env`: URL pública da API (ex: `https://api.seudominio.com`) para configurar webhook da Evolution API
- Nunca commitar `.env` de produção

---

### Task 1: Página de Configurações — API Keys e Corretores

**Files:**
- Modify: `crm-seguros/src/app/(dashboard)/whatsapp/settings/page.tsx`
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/settings/settings-page.tsx`
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/settings/api-keys-section.tsx`
- Create: `crm-seguros/src/app/(dashboard)/whatsapp/settings/corretores-section.tsx`

**Interfaces:**
- Consumes: `GET /api/whatsapp/settings/members?organization_id=...`, `PATCH /api/whatsapp/settings/members/:id`, `POST /api/whatsapp/settings/secrets`, Supabase direto para listar membros da org
- Produces: página com duas seções: chaves de API de LLM e mapeamento de telefones de corretores

- [ ] **Step 1: Criar ApiKeysSection**

Criar `crm-seguros/src/app/(dashboard)/whatsapp/settings/api-keys-section.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Key, Eye, EyeOff, CheckCircle } from "lucide-react";

interface Props {
  organizationId: string;
}

type Provider = "google" | "openai" | "anthropic";

export function ApiKeysSection({ organizationId }: Props) {
  const [keys, setKeys] = useState<Record<Provider, string>>({
    google: "",
    openai: "",
    anthropic: "",
  });
  const [showKey, setShowKey] = useState<Record<Provider, boolean>>({ google: false, openai: false, anthropic: false });
  const [saved, setSaved] = useState<Record<Provider, boolean>>({ google: false, openai: false, anthropic: false });
  const [saving, setSaving] = useState<Provider | null>(null);

  const handleSave = async (provider: Provider) => {
    if (!keys[provider].trim()) return;
    setSaving(provider);
    await fetch("/api/whatsapp/settings/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organization_id: organizationId, provider, encrypted_key: keys[provider].trim() }),
    });
    setSaving(null);
    setSaved((p) => ({ ...p, [provider]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [provider]: false })), 3000);
  };

  const providers: { id: Provider; label: string; hint: string; placeholder: string }[] = [
    { id: "google", label: "Google AI (Gemini)", hint: "Recomendado — gratuito e padrão do sistema", placeholder: "AIza..." },
    { id: "openai", label: "OpenAI (opcional)", hint: "Para usar GPT-4 em agentes específicos", placeholder: "sk-..." },
    { id: "anthropic", label: "Anthropic Claude (opcional)", hint: "Para usar Claude em agentes específicos", placeholder: "sk-ant-..." },
  ];

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Key className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">Chaves de API de LLM</h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Configure as chaves de API dos provedores de IA. A chave do Google (Gemini) é obrigatória.
        As chaves são armazenadas de forma segura no banco de dados.
      </p>

      <div className="space-y-4">
        {providers.map(({ id, label, hint, placeholder }) => (
          <div key={id} className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">{label}</label>
              {id === "google" && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Obrigatório</span>
              )}
            </div>
            <p className="mb-2 text-xs text-muted-foreground">{hint}</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey[id] ? "text" : "password"}
                  value={keys[id]}
                  onChange={(e) => setKeys((p) => ({ ...p, [id]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((p) => ({ ...p, [id]: !p[id] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showKey[id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={() => handleSave(id)}
                disabled={saving === id || !keys[id].trim()}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                {saved[id] ? <><CheckCircle className="h-4 w-4" /> Salvo</> : saving === id ? "..." : "Salvar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar CorretoresSection**

Criar `crm-seguros/src/app/(dashboard)/whatsapp/settings/corretores-section.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { Phone, Save, CheckCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface Member {
  id: string;
  user_id: string;
  role: string;
  whatsapp_phone: string | null;
  users?: { email: string; raw_user_meta_data?: { name?: string; full_name?: string } } | null;
}

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
      const res = await fetch(`/api/whatsapp/settings/members?organization_id=${organizationId}`);
      if (res.ok) {
        const data = await res.json() as { members: Member[] };
        setMembers(data.members);
        const initialPhones: Record<string, string> = {};
        data.members.forEach((m) => { initialPhones[m.id] = m.whatsapp_phone || ""; });
        setPhones(initialPhones);
      }
      setLoading(false);
    };
    fetchMembers();
  }, [organizationId]);

  const handleSavePhone = async (memberId: string) => {
    const phone = phones[memberId]?.replace(/\D/g, "");
    await fetch(`/api/whatsapp/settings/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp_phone: phone || null }),
    });
    setSaved((p) => ({ ...p, [memberId]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [memberId]: false })), 3000);
  };

  const getMemberName = (member: Member): string => {
    const meta = member.users?.raw_user_meta_data;
    return meta?.name || meta?.full_name || member.users?.email || `Usuário ${member.id.slice(0, 8)}`;
  };

  if (loading) return <div className="text-sm text-muted-foreground">Carregando corretores...</div>;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Phone className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">Telefones dos Corretores</h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Vincule o número de WhatsApp de cada corretor. Quando esse número enviar mensagem, o sistema reconhece como corretor e usa o modo MPA.
        Formato: <code className="rounded bg-muted px-1 text-xs">5511999990001</code> (código do país + DDD + número, apenas dígitos).
      </p>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum membro encontrado na organização.</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{getMemberName(member)}</p>
                <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={phones[member.id] || ""}
                  onChange={(e) => setPhones((p) => ({ ...p, [member.id]: e.target.value }))}
                  placeholder="55119..."
                  className="w-36 rounded-lg border bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => handleSavePhone(member.id)}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {saved[member.id] ? <CheckCircle className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
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
```

- [ ] **Step 3: Criar SettingsPage e atualizar page.tsx**

Criar `crm-seguros/src/app/(dashboard)/whatsapp/settings/settings-page.tsx`:
```tsx
"use client";

import { useOrganization } from "@/hooks/use-organization";
import { ApiKeysSection } from "./api-keys-section";
import { CorretoresSection } from "./corretores-section";

export function SettingsPage() {
  const { organizationId, loading } = useOrganization();

  if (loading) return <div className="p-6 text-muted-foreground">Carregando...</div>;
  if (!organizationId) return <div className="p-6 text-muted-foreground">Organização não encontrada.</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações WhatsApp</h1>
        <p className="text-muted-foreground">API keys e mapeamento de corretores</p>
      </div>
      <div className="space-y-6 max-w-2xl">
        <ApiKeysSection organizationId={organizationId} />
        <CorretoresSection organizationId={organizationId} />
      </div>
    </div>
  );
}
```

Substituir `crm-seguros/src/app/(dashboard)/whatsapp/settings/page.tsx`:
```tsx
import { SettingsPage } from "./settings-page";

export default function WhatsAppSettingsPage() {
  return <SettingsPage />;
}
```

- [ ] **Step 4: Criar rotas BFF para settings**

Criar `crm-seguros/src/app/api/whatsapp/settings/secrets/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { organization_id, provider, encrypted_key } = await req.json() as {
    organization_id: string;
    provider: string;
    encrypted_key: string;
  };

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabase.from("wa_provider_secrets").upsert(
    { organization_id, provider, encrypted_key },
    { onConflict: "organization_id,provider" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

Criar `crm-seguros/src/app/api/whatsapp/settings/members/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const organizationId = req.nextUrl.searchParams.get("organization_id");
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase
    .from("wa_organization_members")
    .select("id, user_id, role, whatsapp_phone, users:user_id(email, raw_user_meta_data)")
    .eq("organization_id", organizationId!);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
}
```

Criar `crm-seguros/src/app/api/whatsapp/settings/members/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { whatsapp_phone } = await req.json() as { whatsapp_phone: string | null };
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabase.from("wa_organization_members").update({ whatsapp_phone }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Verificar typecheck**

```bash
cd crm-seguros && pnpm typecheck
```

Expected: sem erros.

- [ ] **Step 6: Testar no browser**

```bash
pnpm dev
```

Navegar para `/whatsapp/settings`. Verificar:
- Seção de API keys com 3 providers
- Inserir chave Google AI → salvar → feedback visual "Salvo!"
- Seção de corretores mostra membros da organização
- Inserir telefone de corretor → salvar → número aparece preenchido

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add WhatsApp settings page with API keys and corretor phone mapping"
```

---

### Task 2: Setup da Organização Inicial

**Objetivo:** Criar a organização no banco de dados para a corretora (um-time setup). Feito via SQL no Supabase após o deploy.

- [ ] **Step 1: Criar SQL de setup inicial**

Criar `agente-crm/scripts/setup-organization.sql`:
```sql
-- 1. Criar organização da corretora
INSERT INTO wa_organizations (id, name, settings)
VALUES (
  uuid_generate_v4(),
  'Andreia Corretora de Seguros',
  '{}'::jsonb
)
RETURNING id;

-- 2. Copiar o ID retornado e usar nos próximos passos
-- Exemplo: '11111111-1111-1111-1111-111111111111'

-- 3. Vincular usuário existente como owner (substituir USER_ID pelo ID real do auth.users)
INSERT INTO wa_organization_members (organization_id, user_id, role, whatsapp_phone)
VALUES (
  'ORGANIZATION_ID_AQUI',
  'USER_ID_AQUI',
  'owner',
  NULL -- configurar depois pela página de Settings
);

-- 4. Criar agente MPA padrão
INSERT INTO wa_agents (
  organization_id, name, description, system_prompt, mode,
  model, provider, temperature, max_tokens, is_active
) VALUES (
  'ORGANIZATION_ID_AQUI',
  'MPA — Andreia',
  'Assistente executiva da Andreia Ferreira Corretora',
  'Você é o MPA — assistente executiva da Andreia Ferreira Corretora de Planos de Saúde.
Você conhece as 6 frentes: Assistente, Clientes, Financeiro, Operadoras, Comercial, Marketing.
Seja direta, objetiva e prática. Responda como uma sócia experiente.
Consulte a base de conhecimento para informações específicas dos agentes MPA.
Regras: nunca invente informações, sempre em português brasileiro, nunca pareça robótica.',
  'mpa',
  'gemini-1.5-flash',
  'google',
  0.7,
  1024,
  true
) RETURNING id;

-- 5. Criar agente de atendimento padrão
INSERT INTO wa_agents (
  organization_id, name, description, system_prompt, mode,
  model, provider, temperature, max_tokens, is_active,
  tools_config
) VALUES (
  'ORGANIZATION_ID_AQUI',
  'Atendimento — Andreia Corretora',
  'Assistente de atendimento ao cliente',
  'Você é a assistente de atendimento da Andreia Ferreira Corretora.
Seu objetivo é qualificar leads: entender a necessidade e coletar informações básicas.
Seja acolhedora e profissional. Nunca prometa valores sem confirmar com a corretora.
Quando tiver nome e interesse do cliente, use a ferramenta createLead para registrar.
Responda sempre em português brasileiro.',
  'client_attendance',
  'gemini-1.5-flash',
  'google',
  0.7,
  1024,
  true,
  '{"search_knowledge": true, "search_faq": true, "crm_access": false, "create_lead": true}'::jsonb
) RETURNING id;
```

- [ ] **Step 2: Documentar como executar**

Executar o SQL acima no Supabase SQL Editor, copiando os IDs retornados para os próximos passos.

- [ ] **Step 3: Commit do script**

```bash
git add agente-crm/scripts/
git commit -m "feat: add one-time organization setup SQL script"
```

---

### Task 3: Deploy na VPS com Docker Compose

**Objetivo:** Colocar o `agente-crm` na mesma VPS onde o `crm-seguros` já roda. O `agente-crm` sobe via Docker Compose e é acessível internamente pelo `crm-seguros` (Next.js) via `http://localhost:3001`.

**Pré-requisito:** VPS com Docker e Docker Compose instalados, domínio configurado, Nginx rodando.

- [ ] **Step 1: Enviar o código para a VPS**

Na máquina local:
```bash
cd "C:\Users\Andreia Ferreira\Desktop"
# Compactar a pasta agente-crm para envio
```

Ou usar git remote para a VPS:
```bash
# Na VPS (via SSH):
git clone <repositório-do-agente-crm> /srv/agente-crm
# OU
scp -r agente-crm usuario@vps-ip:/srv/agente-crm
```

- [ ] **Step 2: Criar arquivo .env de produção na VPS**

Na VPS, via SSH:
```bash
cd /srv/agente-crm
cp .env.example .env
nano .env
```

Preencher com os valores de produção:
```bash
# Supabase (mesmo do crm-seguros)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redis (Docker interno)
REDIS_URL=redis://redis:6379

# Evolution API
EVOLUTION_API_URL=https://evolution.seudominio.com
EVOLUTION_API_KEY=sua-chave
EVOLUTION_WEBHOOK_SECRET=secret-forte-aqui

# Google AI (Gemini)
GOOGLE_AI_API_KEY=AIza...

# App
API_PORT=3001
NODE_ENV=production
API_PUBLIC_URL=https://api.seudominio.com
```

- [ ] **Step 3: Criar docker-compose.prod.yml otimizado**

Criar `/srv/agente-crm/docker-compose.prod.yml`:
```yaml
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "127.0.0.1:3001:3001"
    env_file: .env
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    env_file: .env
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  redis_data:
```

**Nota:** `127.0.0.1:3001:3001` — porta só acessível internamente na VPS, não externamente.

- [ ] **Step 4: Configurar Nginx para a API do agente-crm**

Verificar a configuração atual do Nginx na VPS:
```bash
ls /etc/nginx/sites-available/
cat /etc/nginx/sites-available/crm-seguros  # ou nome similar
```

Criar `/etc/nginx/sites-available/agente-crm-api`:
```nginx
server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        client_max_body_size 55m;
    }
}
```

Ativar e obter SSL (Certbot):
```bash
sudo ln -s /etc/nginx/sites-available/agente-crm-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d api.seudominio.com
```

- [ ] **Step 5: Atualizar .env do crm-seguros na VPS**

No arquivo `.env` ou `.env.local` do `crm-seguros` na VPS, atualizar:
```bash
# WhatsApp Agent API — comunicação interna na VPS
WA_API_URL=http://localhost:3001
NEXT_PUBLIC_WA_API_URL=https://api.seudominio.com
```

Reiniciar o `crm-seguros` para aplicar as variáveis.

- [ ] **Step 6: Build e iniciar os containers**

Na VPS, dentro de `/srv/agente-crm`:
```bash
# Build das imagens
docker compose -f docker-compose.prod.yml build

# Iniciar em background
docker compose -f docker-compose.prod.yml up -d

# Verificar status
docker compose -f docker-compose.prod.yml ps
```

Expected:
```
NAME                  STATUS
agente-crm-api-1      healthy
agente-crm-worker-1   running
agente-crm-redis-1    healthy
```

- [ ] **Step 7: Verificar a API em produção**

```bash
curl https://api.seudominio.com/health
```

Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 8: Testar webhook da Evolution API**

Na Evolution API, configurar o webhook para `https://api.seudominio.com/webhooks/evolution`.

Enviar mensagem de teste:
```bash
curl -X POST https://api.seudominio.com/webhooks/evolution \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","instance":"teste","data":{"key":{"remoteJid":"5511999990001@s.whatsapp.net","fromMe":false,"id":"PROD-TEST-001"},"messageType":"conversation","message":{"conversation":"teste de produção"},"pushName":"Teste"}}'
```

Expected: `{"ok":true}`

- [ ] **Step 9: Commit da configuração de produção**

```bash
git add docker-compose.prod.yml agente-crm/scripts/setup-organization.sql
git commit -m "feat: add production docker-compose and nginx configuration for VPS deploy"
```

---

### Task 4: Monitoramento e Manutenção

- [ ] **Step 1: Verificar logs em produção**

```bash
# Logs da API
docker compose -f docker-compose.prod.yml logs api --tail=50

# Logs do worker
docker compose -f docker-compose.prod.yml logs worker --tail=50

# Seguir logs em tempo real
docker compose -f docker-compose.prod.yml logs -f
```

- [ ] **Step 2: Criar script de atualização**

Criar `agente-crm/scripts/deploy-update.sh`:
```bash
#!/bin/bash
set -e
echo "Atualizando agente-crm na VPS..."
cd /srv/agente-crm
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --no-deps api worker
docker compose -f docker-compose.prod.yml ps
echo "Deploy concluído!"
```

```bash
chmod +x scripts/deploy-update.sh
```

- [ ] **Step 3: Commit**

```bash
git add scripts/
git commit -m "feat: add VPS deploy update script"
```

---

### Task 5: Verificação Final do Sistema Completo

- [ ] **Step 1: Checklist de funcionalidades**

Verificar cada item no ambiente de produção:

- [ ] Health check da API: `https://api.seudominio.com/health` retorna 200
- [ ] Webhook Evolution funciona (testa via curl)
- [ ] Dashboard abre em `https://seudominio.com/whatsapp`
- [ ] Criar agente MPA → aparece na lista
- [ ] Criar instância → QR code gerado
- [ ] Configurar chave Google AI na página de Settings
- [ ] Configurar telefone de corretor na página de Settings
- [ ] Enviar mensagem do corretor → aparece no inbox como "MPA", bot responde
- [ ] Enviar mensagem de número desconhecido → aparece como "Atendimento", bot qualifica
- [ ] Takeover humano funciona via inbox
- [ ] Realtime atualiza sem refresh manual

- [ ] **Step 2: Importar knowledge base MPA**

Após confirmar que tudo funciona:
1. Anotar `MPA_AGENT_ID` criado pelo script SQL (Task 2)
2. Anotar `ORGANIZATION_ID`
3. Rodar o script de importação:

```bash
# Em desenvolvimento (na máquina local, com .env configurado)
cd Desktop/agente-crm
MPA_AGENT_ID=<id-do-agente-mpa> ORGANIZATION_ID=<id-da-org> pnpm tsx scripts/import-mpa-knowledge.ts
```

Expected: `Importação concluída! X arquivos processados`

- [ ] **Step 3: Commit final**

```bash
git status
git add -A && git commit -m "chore: fase 8 complete — settings dashboard and VPS deploy"
```
