# Design: Sistema de Permissões e Acesso por Perfil

**Data:** 2026-05-23  
**Status:** Aprovado

---

## Objetivo

Implementar dois perfis de acesso no CRM: **Admin** (acesso total) e **Vendedor** (acesso restrito aos próprios dados). Admins convidam vendedores por e-mail; cada vendedor tem login próprio e vê apenas seus leads, clientes e agenda.

---

## Perfis de Acesso

| Módulo | Admin | Vendedor |
|---|---|---|
| Dashboard | Tudo | Só os próprios números |
| CRM (leads) | Todos | Só os atribuídos a ele |
| Clientes | Todos | Só os vinculados a ele |
| Agenda | Todos | Só os próprios |
| Financeiro | ✅ | ❌ (rota bloqueada) |
| Gestão | ✅ | ❌ (rota bloqueada) |
| Marketing | ✅ | ❌ (rota bloqueada) |
| Configurações | ✅ | ❌ (rota bloqueada) |
| Scripts (futuro) | ✅ | ✅ |

Registros sem `vendedor_id` (dados históricos) são visíveis **apenas para admins**.

---

## Banco de Dados

### Nova tabela `usuarios`

```sql
create table usuarios (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete cascade,
  nome          text not null,
  perfil        text not null check (perfil in ('admin', 'vendedor')),
  vendedor_id   uuid references vendedores(id) on delete set null,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);
```

- `vendedor_id` é `null` para admins, preenchido para vendedores
- Um vendedor em `vendedores` pode ter no máximo um registro em `usuarios`

### Alterações em tabelas existentes

```sql
-- Adicionar vendedor_id às tabelas que precisam de isolamento
alter table leads    add column if not exists vendedor_id uuid references vendedores(id);
alter table clientes add column if not exists vendedor_id uuid references vendedores(id);
alter table agenda   add column if not exists vendedor_id uuid references vendedores(id);
alter table vendas   add column if not exists vendedor_id uuid references vendedores(id);
```

Para `vendas`, preencher `vendedor_id` retroativamente via `UPDATE ... JOIN vendedores ON vendedores.nome = vendas.vendedor`.

### Políticas RLS

**`usuarios`:**
- Qualquer autenticado pode ler o próprio registro (`auth_user_id = auth.uid()`)
- Apenas admins podem inserir/atualizar/deletar

**`leads`, `clientes`, `agenda`:**
- Admin: SELECT/INSERT/UPDATE/DELETE sem restrição
- Vendedor: SELECT/INSERT/UPDATE apenas onde `vendedor_id = (select vendedor_id from usuarios where auth_user_id = auth.uid())`

**`vendas`, `comissoes`, `contas`, `parcelas_regra`, `regras_comissao`:**
- SELECT/INSERT/UPDATE/DELETE apenas para admins (`meu_perfil() = 'admin'`)
- Vendedores bloqueados tanto na rota (middleware) quanto no banco (RLS)

Helper function para reutilizar nas políticas:
```sql
create or replace function meu_perfil()
returns text language sql security definer stable as $$
  select perfil from usuarios where auth_user_id = auth.uid()
$$;

create or replace function meu_vendedor_id()
returns uuid language sql security definer stable as $$
  select vendedor_id from usuarios where auth_user_id = auth.uid()
$$;
```

---

## Autenticação e Convite

**Fluxo de convite (admin → vendedor):**
1. Admin acessa Configurações → Usuários → "Novo Usuário"
2. Preenche nome, e-mail, perfil e (se vendedor) seleciona o cadastro em Gestão
3. Clica em "Enviar Convite"
4. Server Action chama `supabase.auth.admin.inviteUserByEmail(email)` com a `service_role` key (variável de ambiente `SUPABASE_SERVICE_ROLE_KEY`, nunca exposta ao browser)
5. Cria registro em `usuarios` com `ativo: true`
6. Vendedor recebe e-mail com link para criar senha
7. Após criar senha, já faz login normalmente pela tela padrão

**Reenvio:** botão "Reenviar convite" chama `inviteUserByEmail` novamente enquanto o usuário ainda não fez login pela primeira vez.

**Remoção de acesso:** marcar `usuarios.ativo = false`. O middleware detecta e redireciona para `/login`.

---

## Sidebar e Proteção de Rotas

### Middleware (`middleware.ts`)

Novo arquivo na raiz do projeto. Para cada request em rota protegida:
1. Verifica sessão ativa (comportamento atual)
2. Busca perfil em `usuarios`
3. Se vendedor tenta acessar `/financeiro`, `/gestao`, `/configuracoes` ou `/marketing` → redirect `/dashboard`
4. Se `usuarios.ativo = false` → redirect `/login`

### Sidebar

O `layout.tsx` (server component) busca o perfil do usuário logado e passa como prop para `Sidebar`. O `Sidebar` renderiza apenas os itens permitidos para o perfil.

O rodapé do sidebar (avatar + nome) passa a exibir o nome real do usuário logado, buscado de `usuarios.nome` — hoje está hardcoded "Andreia Oliveira".

---

## Filtragem de Dados por Módulo

O `vendedor_id` do usuário logado é lido no server component de cada página. Se perfil = `vendedor`, é adicionado como filtro na query. Se `admin`, sem filtro.

**CRM / leads:**
- Vendedor: lista filtrada por `vendedor_id`
- Campo vendedor no formulário de criação: travado com o nome dele, preenchido automaticamente
- Admin: vê todos, pode atribuir qualquer vendedor

**Clientes:**
- Mesmo comportamento do CRM
- Ao criar cliente, `vendedor_id` preenchido automaticamente

**Agenda:**
- Compromissos filtrados por `vendedor_id`
- Ao criar evento, `vendedor_id` preenchido automaticamente

**Dashboard:**
- Cards de leads, clientes e vendas filtrados por `vendedor_id`
- Gráficos e totais refletem só a produção do vendedor logado

**RLS como segunda camada de segurança:**
Mesmo que algum server component esqueça o filtro, as políticas RLS do Supabase garantem que o vendedor só recebe suas próprias linhas.

---

## Configurações — Seção "Usuários"

Visível apenas para admins. Inserida como nova seção na página `/configuracoes`.

**Lista:** tabela com Nome, E-mail, Perfil (badge), Vendedor vinculado, Status, ações (Editar, Desativar, Reenviar convite).

**Formulário "Novo Usuário":**
- Nome, E-mail, Perfil (Admin / Vendedor)
- Vendedor vinculado: dropdown com cadastros ativos de Gestão (aparece apenas se perfil = Vendedor)
- Botão "Enviar Convite"

**Editar:** permite trocar nome, perfil, vendedor vinculado e status. E-mail não pode ser alterado (identificador do Supabase Auth).

---

## Variáveis de Ambiente Necessárias

```
SUPABASE_SERVICE_ROLE_KEY=...   # já deve existir ou será adicionada
```

Esta chave fica apenas no servidor (Server Actions / API routes). Nunca no cliente.

---

## Fora do Escopo

- Permissões granulares dentro de um mesmo perfil (ex: vendedor A ver clientes do vendedor B)
- Logs de auditoria de acesso
- Módulo Marketing (bloqueado na rota, sem filtragem por ora)
- ScriptZap (ainda não existe)
