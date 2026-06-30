-- DEPLOY COMPLETO -- rode este arquivo no SQL Editor do Supabase

-- === supabase/migrations/20260520_financeiro.sql ===
-- Module: Financeiro
-- Tables: vendas, regras_comissao, parcelas_regra, comissoes, contas, mapeamentos_importacao, importacoes_comissao

create table if not exists vendas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete set null,
  cliente_nome text not null,
  operadora text not null,
  valor_plano numeric not null,
  vendedor text not null,
  data_venda date not null,
  status text not null default 'Ativo' check (status in ('Ativo', 'Cancelado')),
  origem text not null default 'manual' check (origem in ('cliente', 'manual')),
  criado_em timestamptz not null default now()
);

create table if not exists regras_comissao (
  id uuid primary key default gen_random_uuid(),
  operadora text not null unique,
  percentual_total numeric not null,
  num_parcelas integer not null,
  percentual_vitalicio numeric not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists parcelas_regra (
  id uuid primary key default gen_random_uuid(),
  regra_id uuid not null references regras_comissao(id) on delete cascade,
  numero_parcela integer not null,
  percentual_empresa numeric not null,
  percentual_vendedor numeric not null,
  unique (regra_id, numero_parcela)
);

create table if not exists comissoes (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references vendas(id) on delete cascade,
  tipo text not null check (tipo in ('parcela', 'vitalicio')),
  numero_parcela integer,
  valor_bruto numeric not null,
  valor_empresa numeric not null,
  valor_vendedor numeric not null,
  status_empresa text not null default 'Pendente' check (status_empresa in ('Pendente', 'Recebido')),
  status_vendedor text not null default 'Pendente' check (status_vendedor in ('Pendente', 'Recebido')),
  data_prevista date not null,
  data_recebida_empresa date,
  data_recebida_vendedor date,
  criado_em timestamptz not null default now()
);

create table if not exists contas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('receber', 'pagar')),
  descricao text not null,
  valor numeric not null,
  vencimento date not null,
  status text not null default 'Pendente' check (status in ('Pendente', 'Recebido', 'Pago')),
  observacoes text,
  criado_em timestamptz not null default now()
);

create table if not exists mapeamentos_importacao (
  id uuid primary key default gen_random_uuid(),
  operadora text not null unique,
  mapeamento jsonb not null default '{}',
  atualizado_em timestamptz not null default now()
);

create table if not exists importacoes_comissao (
  id uuid primary key default gen_random_uuid(),
  operadora text not null,
  nome_arquivo text not null,
  total_registros integer not null default 0,
  total_valor numeric not null default 0,
  erros_count integer not null default 0,
  erros_detalhe jsonb not null default '[]',
  criado_em timestamptz not null default now()
);

-- === supabase/migrations/20260520_cliente_campos_extra.sql ===
-- Novos campos na tabela clientes

alter table clientes
  add column if not exists data_inicio_plano date,
  add column if not exists data_vencimento_plano date,
  add column if not exists coparticipacao boolean default false,
  add column if not exists tipo_acomodacao text,
  add column if not exists abrangencia text,
  add column if not exists carencia boolean default false,
  add column if not exists forma_pagamento text,
  add column if not exists dia_vencimento_boleto integer,
  add column if not exists corretora_responsavel text,
  add column if not exists percentual_comissao_corretora numeric,
  add column if not exists percentual_comissao_vendedor numeric,
  add column if not exists tem_vitalicio boolean default false,
  add column if not exists percentual_vitalicio numeric;

-- Tabela de documentos do cliente
create table if not exists documentos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  tipo text not null check (tipo in ('Contrato','Proposta','RG','CNH','Outro')),
  nome_arquivo text not null,
  storage_path text not null,
  tamanho_bytes integer,
  criado_em timestamptz not null default now()
);

-- Bucket de storage (ignorar erro se já existir)

-- === supabase/migrations/20260521_gestao_vendedores.sql ===
-- Module: Gestão de Vendedores
-- Already executed in Supabase on 2026-05-21

create table if not exists vendedores (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Dados pessoais
alter table vendedores add column if not exists cpf_cnpj             text;
alter table vendedores add column if not exists rg                   text;
alter table vendedores add column if not exists data_nascimento      date;
alter table vendedores add column if not exists sexo                 text;
alter table vendedores add column if not exists telefone             text;
alter table vendedores add column if not exists email                text;
alter table vendedores add column if not exists endereco_cep         text;
alter table vendedores add column if not exists endereco_logradouro  text;
alter table vendedores add column if not exists endereco_numero      text;
alter table vendedores add column if not exists endereco_complemento text;
alter table vendedores add column if not exists endereco_bairro      text;
alter table vendedores add column if not exists endereco_cidade      text;
alter table vendedores add column if not exists endereco_estado      text;

-- Dados profissionais
alter table vendedores add column if not exists tipo           text;
alter table vendedores add column if not exists corretora      text;
alter table vendedores add column if not exists data_admissao  date;
alter table vendedores add column if not exists data_demissao  date;
alter table vendedores add column if not exists susep          text;

-- Configuração de repasse
alter table vendedores add column if not exists percentual_repasse   numeric(5,2);
alter table vendedores add column if not exists forma_repasse        text;
alter table vendedores add column if not exists repasse_sobre        text;
alter table vendedores add column if not exists tem_vitalicio        boolean not null default false;
alter table vendedores add column if not exists percentual_vitalicio numeric(5,2);

-- Informações bancárias
alter table vendedores add column if not exists banco      text;
alter table vendedores add column if not exists agencia    text;
alter table vendedores add column if not exists conta      text;
alter table vendedores add column if not exists tipo_conta text;
alter table vendedores add column if not exists pix        text;

-- Observações
alter table vendedores add column if not exists observacoes text;

-- Nível do vendedor (adicionado após ajuste de 2026-05-21)
alter table vendedores add column if not exists nivel text;

-- === supabase/migrations/20260521_operadoras_completo.sql ===
-- 1. Enriquecer tabela operadoras
ALTER TABLE operadoras
  ADD COLUMN IF NOT EXISTS cnpj         text,
  ADD COLUMN IF NOT EXISTS telefone     text,
  ADD COLUMN IF NOT EXISTS email_gestor text,
  ADD COLUMN IF NOT EXISTS site         text,
  ADD COLUMN IF NOT EXISTS empresa      text,
  ADD COLUMN IF NOT EXISTS observacoes  text;

-- 2. Enriquecer regras_comissao
ALTER TABLE regras_comissao
  ADD COLUMN IF NOT EXISTS desconta_imposto   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS percentual_imposto numeric  DEFAULT 0;

-- 3. Nova tabela de repasse por nível de vendedor
CREATE TABLE IF NOT EXISTS repasse_grupo_vendedor (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regra_id   uuid NOT NULL REFERENCES regras_comissao(id) ON DELETE CASCADE,
  nivel      text NOT NULL,
  percentual numeric NOT NULL DEFAULT 0,
  UNIQUE(regra_id, nivel)
);

-- === supabase/migrations/20260522_cnpjs_recebimento.sql ===
-- supabase/migrations/20260522_cnpjs_recebimento.sql

-- 1. Tabela de CNPJs de Recebimento
CREATE TABLE IF NOT EXISTS cnpjs_recebimento (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL UNIQUE,
  razao_social text,
  cnpj         text,
  banco        text,
  agencia      text,
  conta        text,
  tipo_conta   text,
  pix          text,
  status       text NOT NULL DEFAULT 'Ativo',
  criado_em    timestamptz NOT NULL DEFAULT now()
);

-- 2. Dados iniciais — os 3 CNPJs existentes
INSERT INTO cnpjs_recebimento (nome) VALUES
  ('A2 Prime'),
  ('A2 Corretora'),
  ('MEI')
ON CONFLICT DO NOTHING;

-- 3. Adicionar cnpj_recebimento_id em regras_comissao
ALTER TABLE regras_comissao
  ADD COLUMN IF NOT EXISTS cnpj_recebimento_id uuid REFERENCES cnpjs_recebimento(id) ON DELETE SET NULL;

-- 4. Adicionar cnpj_recebimento_id em vendas
ALTER TABLE vendas
  ADD COLUMN IF NOT EXISTS cnpj_recebimento_id uuid REFERENCES cnpjs_recebimento(id) ON DELETE SET NULL;

-- === supabase/migrations/20260522165247_fix_rls_regras_comissao.sql ===
-- Fix: habilitar políticas RLS para regras_comissao e tabelas relacionadas
-- Problema: RLS estava habilitado mas sem policies — bloqueava todo INSERT/UPDATE/DELETE

-- 1. regras_comissao: permitir acesso total a usuários autenticados
alter table regras_comissao enable row level security;

drop policy if exists "regras_comissao_auth" on regras_comissao;
drop policy if exists "regras_comissao_auth" on regras_comissao;
create policy "regras_comissao_auth" on regras_comissao
  for all to authenticated using (true) with check (true);

-- 2. parcelas_regra: mesma política
alter table parcelas_regra enable row level security;

drop policy if exists "parcelas_regra_auth" on parcelas_regra;
drop policy if exists "parcelas_regra_auth" on parcelas_regra;
create policy "parcelas_regra_auth" on parcelas_regra
  for all to authenticated using (true) with check (true);

-- 3. repasse_grupo_vendedor: mesma política
alter table repasse_grupo_vendedor enable row level security;

drop policy if exists "repasse_grupo_vendedor_auth" on repasse_grupo_vendedor;
drop policy if exists "repasse_grupo_vendedor_auth" on repasse_grupo_vendedor;
create policy "repasse_grupo_vendedor_auth" on repasse_grupo_vendedor
  for all to authenticated using (true) with check (true);

-- 4. Remover unique constraint em operadora (incompatível com múltiplas regras por CNPJ)
alter table regras_comissao drop constraint if exists regras_comissao_operadora_key;

-- 5. Nova constraint: única por (operadora + cnpj_recebimento_id)
alter table regras_comissao
  drop constraint if exists regras_comissao_operadora_cnpj_key;
alter table regras_comissao
  add constraint regras_comissao_operadora_cnpj_key
  unique (operadora, cnpj_recebimento_id);

-- === supabase/migrations/20260522233341_despesas_fixas.sql ===
-- despesas_fixas: despesas mensais fixas da empresa
create table if not exists despesas_fixas (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  valor          numeric not null,
  dia_vencimento integer not null check (dia_vencimento between 1 and 31),
  categoria      text not null default 'Outros',
  empresa        text,
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now()
);

-- Adiciona colunas em contas para suportar despesas e categorias
alter table contas
  add column if not exists categoria       text,
  add column if not exists despesa_fixa_id uuid references despesas_fixas(id) on delete set null;

-- Adiciona coluna empresa em contas (caso ainda não exista)
alter table contas
  add column if not exists empresa text;

-- RLS despesas_fixas
alter table despesas_fixas enable row level security;

create policy "auth_select_despesas_fixas"
  on despesas_fixas for select to authenticated using (true);

create policy "auth_insert_despesas_fixas"
  on despesas_fixas for insert to authenticated with check (true);

create policy "auth_update_despesas_fixas"
  on despesas_fixas for update to authenticated using (true);

create policy "auth_delete_despesas_fixas"
  on despesas_fixas for delete to authenticated using (true);

grant all on despesas_fixas to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- categorias_despesa: categorias configuráveis nas Configurações do sistema
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists categorias_despesa (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null unique,
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Categorias padrão
insert into categorias_despesa (nome) values
  ('Aluguel'), ('Internet'), ('Telefone'), ('Contador'),
  ('Sistema'), ('Salário'), ('Imposto'), ('Outros')
on conflict (nome) do nothing;

-- RLS categorias_despesa
alter table categorias_despesa enable row level security;

create policy "auth_select_categorias_despesa"
  on categorias_despesa for select to authenticated using (true);

create policy "auth_insert_categorias_despesa"
  on categorias_despesa for insert to authenticated with check (true);

create policy "auth_update_categorias_despesa"
  on categorias_despesa for update to authenticated using (true);

create policy "auth_delete_categorias_despesa"
  on categorias_despesa for delete to authenticated using (true);

grant all on categorias_despesa to authenticated;

-- === supabase/migrations/20260523_usuarios_permissoes.sql ===
-- supabase/migrations/20260523_usuarios_permissoes.sql

-- Tabela de usuários do sistema
create table if not exists usuarios (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete cascade,
  nome          text not null,
  email         text,
  perfil        text not null check (perfil in ('admin', 'vendedor')),
  vendedor_id   uuid references vendedores(id) on delete set null,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);

-- RLS na própria tabela usuarios
alter table usuarios enable row level security;

-- Usuário autenticado lê apenas o próprio registro
drop policy if exists "usuario_le_proprio" on usuarios;
drop policy if exists "usuario_le_proprio" on usuarios;
create policy "usuario_le_proprio" on usuarios
  for select using (auth_user_id = auth.uid());

-- Service role faz tudo (Server Actions usam service role)
drop policy if exists "service_role_full" on usuarios;
drop policy if exists "service_role_full" on usuarios;
create policy "service_role_full" on usuarios
  for all using (auth.role() = 'service_role');

-- Adicionar vendedor_id nas tabelas que precisam de isolamento
alter table leads    add column if not exists vendedor_id uuid references vendedores(id);
alter table clientes add column if not exists vendedor_id uuid references vendedores(id);
alter table agenda   add column if not exists vendedor_id uuid references vendedores(id);
alter table vendas   add column if not exists vendedor_id uuid references vendedores(id);

-- Preencher vendedor_id retroativamente a partir do campo texto existente
update leads    set vendedor_id = v.id from vendedores v where leads.vendedor    = v.nome and leads.vendedor_id    is null;
update clientes set vendedor_id = v.id from vendedores v where clientes.vendedor = v.nome and clientes.vendedor_id is null;
update vendas   set vendedor_id = v.id from vendedores v where vendas.vendedor   = v.nome and vendas.vendedor_id   is null;

-- Funções helper para as políticas RLS (usadas na Task 5)
create or replace function meu_perfil()
returns text language sql security definer stable as $$
  select perfil from usuarios where auth_user_id = auth.uid()
$$;

create or replace function meu_vendedor_id()
returns uuid language sql security definer stable as $$
  select vendedor_id from usuarios where auth_user_id = auth.uid()
$$;

-- === supabase/migrations/20260523_rls_permissoes.sql ===
-- supabase/migrations/20260523_rls_permissoes.sql
-- Executar APÓS as admins serem cadastradas em usuarios

-- ── LEADS ──
alter table leads enable row level security;

drop policy if exists "leads_admin_tudo" on leads;
create policy "leads_admin_tudo" on leads
  for all using (meu_perfil() = 'admin');

drop policy if exists "leads_vendedor_proprios" on leads;
create policy "leads_vendedor_proprios" on leads
  for select using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

drop policy if exists "leads_vendedor_insert" on leads;
create policy "leads_vendedor_insert" on leads
  for insert with check (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

drop policy if exists "leads_vendedor_update" on leads;
create policy "leads_vendedor_update" on leads
  for update using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

-- ── CLIENTES ──
alter table clientes enable row level security;

drop policy if exists "clientes_admin_tudo" on clientes;
create policy "clientes_admin_tudo" on clientes
  for all using (meu_perfil() = 'admin');

drop policy if exists "clientes_vendedor_proprios" on clientes;
create policy "clientes_vendedor_proprios" on clientes
  for select using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

drop policy if exists "clientes_vendedor_insert" on clientes;
create policy "clientes_vendedor_insert" on clientes
  for insert with check (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

drop policy if exists "clientes_vendedor_update" on clientes;
create policy "clientes_vendedor_update" on clientes
  for update using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

-- ── AGENDA ──
alter table agenda enable row level security;

drop policy if exists "agenda_admin_tudo" on agenda;
create policy "agenda_admin_tudo" on agenda
  for all using (meu_perfil() = 'admin');

drop policy if exists "agenda_vendedor_proprios" on agenda;
create policy "agenda_vendedor_proprios" on agenda
  for select using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

drop policy if exists "agenda_vendedor_insert" on agenda;
create policy "agenda_vendedor_insert" on agenda
  for insert with check (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

drop policy if exists "agenda_vendedor_update" on agenda;
create policy "agenda_vendedor_update" on agenda
  for update using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

-- ── FINANCEIRO — apenas admins ──
alter table vendas             enable row level security;
alter table comissoes          enable row level security;
alter table contas             enable row level security;
alter table regras_comissao    enable row level security;
alter table parcelas_regra     enable row level security;
alter table cnpjs_recebimento  enable row level security;
alter table categorias_despesa enable row level security;
alter table despesas_fixas     enable row level security;

drop policy if exists "vendas_admin" on vendas;
create policy "vendas_admin"             on vendas             for all using (meu_perfil() = 'admin');
drop policy if exists "comissoes_admin" on comissoes;
create policy "comissoes_admin"          on comissoes          for all using (meu_perfil() = 'admin');
drop policy if exists "contas_admin" on contas;
create policy "contas_admin"             on contas             for all using (meu_perfil() = 'admin');
drop policy if exists "regras_comissao_admin" on regras_comissao;
create policy "regras_comissao_admin"    on regras_comissao    for all using (meu_perfil() = 'admin');
drop policy if exists "parcelas_regra_admin" on parcelas_regra;
create policy "parcelas_regra_admin"     on parcelas_regra     for all using (meu_perfil() = 'admin');
drop policy if exists "cnpjs_recebimento_admin" on cnpjs_recebimento;
create policy "cnpjs_recebimento_admin"  on cnpjs_recebimento  for all using (meu_perfil() = 'admin');
drop policy if exists "categorias_despesa_admin" on categorias_despesa;
create policy "categorias_despesa_admin" on categorias_despesa for all using (meu_perfil() = 'admin');
drop policy if exists "despesas_fixas_admin" on despesas_fixas;
create policy "despesas_fixas_admin"     on despesas_fixas     for all using (meu_perfil() = 'admin');

-- ── TABELAS COMPARTILHADAS (leitura por todos autenticados) ──
alter table vendedores  enable row level security;
alter table operadoras  enable row level security;
alter table tipos_agenda enable row level security;

drop policy if exists "vendedores_leitura" on vendedores;
create policy "vendedores_leitura"   on vendedores   for select using (auth.role() = 'authenticated');
drop policy if exists "vendedores_admin" on vendedores;
create policy "vendedores_admin"     on vendedores   for all    using (meu_perfil() = 'admin');
drop policy if exists "operadoras_leitura" on operadoras;
create policy "operadoras_leitura"   on operadoras   for select using (auth.role() = 'authenticated');
drop policy if exists "operadoras_admin" on operadoras;
create policy "operadoras_admin"     on operadoras   for all    using (meu_perfil() = 'admin');
drop policy if exists "tipos_agenda_leitura" on tipos_agenda;
create policy "tipos_agenda_leitura" on tipos_agenda for select using (auth.role() = 'authenticated');
drop policy if exists "tipos_agenda_todos" on tipos_agenda;
create policy "tipos_agenda_todos"   on tipos_agenda for all    using (auth.role() = 'authenticated');

-- === supabase/migrations/20260523202831_add_vendedor_id_to_clientes.sql ===
alter table clientes add column if not exists vendedor_id uuid references vendedores(id) on delete set null;

-- === supabase/migrations/20260525130633_cascade_delete_cliente.sql ===
-- Quando um cliente é apagado, apagar automaticamente todas as vendas e comissões dele

-- 1. Limpar registros órfãos já existentes (clientes apagados anteriormente)
DELETE FROM vendas WHERE cliente_id IS NULL AND origem = 'cliente';

-- 2. Trocar ON DELETE SET NULL por ON DELETE CASCADE na tabela vendas
ALTER TABLE vendas
  DROP CONSTRAINT IF EXISTS vendas_cliente_id_fkey;

ALTER TABLE vendas
  ADD CONSTRAINT vendas_cliente_id_fkey
    FOREIGN KEY (cliente_id)
    REFERENCES clientes(id)
    ON DELETE CASCADE;

-- === supabase/migrations/20260525_contas_redesign.sql ===
-- contas: suporte a tipos de lançamento e agrupamento de parcelas
alter table contas
  add column if not exists tipo_lancamento text not null default 'unica'
    check (tipo_lancamento in ('unica', 'parcelada', 'recorrente')),
  add column if not exists grupo_id       uuid,
  add column if not exists parcela_numero integer,
  add column if not exists total_parcelas integer;

-- categorias_despesa: tipo padrão por categoria
alter table categorias_despesa
  add column if not exists tipo_padrao text not null default 'unica'
    check (tipo_padrao in ('unica', 'recorrente'));

-- Atualizar tipo_padrao das categorias padrão
update categorias_despesa set tipo_padrao = 'recorrente'
  where nome in ('Aluguel','Internet','Telefone','Contador','Sistema','Salário');

update categorias_despesa set tipo_padrao = 'unica'
  where nome in ('Imposto','Outros');

-- contas geradas por despesas_fixas existentes marcadas como recorrente
update contas set tipo_lancamento = 'recorrente'
  where despesa_fixa_id is not null;

-- === supabase/migrations/20260526_niveis_vendedor.sql ===
create table if not exists niveis_vendedor (
  id   uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true
);

insert into niveis_vendedor (nome) values
  ('Iniciante'),
  ('Experiente'),
  ('VIP')
on conflict do nothing;

alter table niveis_vendedor enable row level security;

create policy "auth_select_niveis_vendedor"
  on niveis_vendedor for select to authenticated using (true);

create policy "auth_insert_niveis_vendedor"
  on niveis_vendedor for insert to authenticated with check (true);

create policy "auth_update_niveis_vendedor"
  on niveis_vendedor for update to authenticated using (true);

create policy "auth_delete_niveis_vendedor"
  on niveis_vendedor for delete to authenticated using (true);

grant all on niveis_vendedor to authenticated;

-- === supabase/migrations/20260526_vendas_data_vencimento.sql ===
alter table vendas
  add column if not exists data_vencimento date;

-- === supabase/migrations/20260526_adesao_direta.sql ===
-- Marca regras com adesão direta ao vendedor (ex: Dental Center / odonto)
alter table regras_comissao
  add column if not exists adesao_direta boolean not null default false;

-- Adiciona status 'Direto' para comissões onde corretora não recebe (adesão odonto)
alter table comissoes
  drop constraint if exists comissoes_status_empresa_check;

alter table comissoes
  add constraint comissoes_status_empresa_check
  check (status_empresa in ('Pendente', 'Recebido', 'Direto'));

-- === supabase/migrations/20260526_vendedor_comissoes_access.sql ===
-- supabase/migrations/20260526_vendedor_comissoes_access.sql

-- Vendedor pode ler suas próprias vendas
drop policy if exists "vendas_vendedor_proprios" on vendas;
create policy "vendas_vendedor_proprios" on vendas
  for select using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

-- Vendedor pode ler comissões das próprias vendas
drop policy if exists "comissoes_vendedor_proprios" on comissoes;
create policy "comissoes_vendedor_proprios" on comissoes
  for select using (
    meu_perfil() = 'vendedor' and
    exists (
      select 1 from vendas v
      where v.id = comissoes.venda_id
      and v.vendedor_id = meu_vendedor_id()
    )
  );

-- === supabase/migrations/20260527_carteira_vitalicia.sql ===
-- Campos de fase e vitalício na tabela de clientes
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS fase_cliente text NOT NULL DEFAULT 'ativo'
    CHECK (fase_cliente IN ('ativo', 'vitalicio')),
  ADD COLUMN IF NOT EXISTS vitalicio_valor_estimado numeric,
  ADD COLUMN IF NOT EXISTS vitalicio_dia_previsto integer CHECK (vitalicio_dia_previsto BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS vitalicio_inicio date;

-- Referência ao cliente vitalício na tabela de contas
ALTER TABLE contas
  ADD COLUMN IF NOT EXISTS cliente_vitalicio_id uuid REFERENCES clientes(id) ON DELETE SET NULL;

-- Índice para busca rápida de contas do vitalício
CREATE INDEX IF NOT EXISTS idx_contas_cliente_vitalicio ON contas(cliente_vitalicio_id);

-- === supabase/migrations/20260527_carteira_vitalicia_unique.sql ===
-- Índice único: cada cliente vitalício só pode ter uma conta a receber por mês
-- Protege contra race condition quando dois usuários carregam /financeiro ao mesmo tempo
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_vitalicio_mes_unico
  ON contas (cliente_vitalicio_id, date_trunc('month', vencimento::timestamp))
  WHERE cliente_vitalicio_id IS NOT NULL;

-- === supabase/migrations/20260528_despesa_fixa_unique.sql ===
-- Índice único para evitar race condition na geração de contas de despesas fixas.
-- A geração ocorre no page load do Financeiro; sem este índice, dois acessos simultâneos
-- duplicam todas as contas do mês. Espelha idx_contas_vitalicio_mes_unico (carteira vitalícia).
create unique index if not exists idx_contas_despesa_fixa_mes_unico
  on contas (despesa_fixa_id, date_trunc('month', vencimento::timestamp))
  where despesa_fixa_id is not null;

-- === supabase/migrations/20260528_reset_rls_clientes_vendas.sql ===
-- Apaga TODAS as policies de clientes e vendas (inclusive não documentadas)
-- e recria apenas as corretas.

-- ─── Remove todas as policies de clientes ────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'clientes' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON clientes';
  END LOOP;
END;
$$;

-- ─── Remove todas as policies de vendas ──────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'vendas' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON vendas';
  END LOOP;
END;
$$;

-- ─── Garante que RLS está habilitado ─────────────────────────────────────────
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas   ENABLE ROW LEVEL SECURITY;

-- ─── Policies de CLIENTES ─────────────────────────────────────────────────────
drop policy if exists "clientes_admin_tudo" on clientes;
CREATE POLICY "clientes_admin_tudo" ON clientes
  FOR ALL USING (meu_perfil() = 'admin')
  WITH CHECK (meu_perfil() = 'admin');

drop policy if exists "clientes_vendedor_select" on clientes;
CREATE POLICY "clientes_vendedor_select" ON clientes
  FOR SELECT USING (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  );

drop policy if exists "clientes_vendedor_insert" on clientes;
CREATE POLICY "clientes_vendedor_insert" ON clientes
  FOR INSERT WITH CHECK (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  );

drop policy if exists "clientes_vendedor_update" on clientes;
CREATE POLICY "clientes_vendedor_update" ON clientes
  FOR UPDATE
  USING (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  )
  WITH CHECK (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  );

-- ─── Policies de VENDAS ───────────────────────────────────────────────────────
drop policy if exists "vendas_admin" on vendas;
CREATE POLICY "vendas_admin" ON vendas
  FOR ALL USING (meu_perfil() = 'admin')
  WITH CHECK (meu_perfil() = 'admin');

drop policy if exists "vendas_vendedor_select" on vendas;
CREATE POLICY "vendas_vendedor_select" ON vendas
  FOR SELECT USING (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  );

drop policy if exists "vendas_vendedor_insert" on vendas;
CREATE POLICY "vendas_vendedor_insert" ON vendas
  FOR INSERT WITH CHECK (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  );

drop policy if exists "vendas_vendedor_update" on vendas;
CREATE POLICY "vendas_vendedor_update" ON vendas
  FOR UPDATE
  USING (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  )
  WITH CHECK (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  );

-- === supabase/migrations/20260529_fix_comissoes_check.sql ===
-- Adiciona 'Cancelado' às CHECK constraints de comissoes.
-- status_empresa já tinha 'Direto' (adesao_direta.sql); mantém.
-- status_vendedor nunca teve 'Cancelado'; adiciona.

alter table comissoes
  drop constraint if exists comissoes_status_empresa_check;

alter table comissoes
  add constraint comissoes_status_empresa_check
  check (status_empresa in ('Pendente', 'Recebido', 'Direto', 'Cancelado'));

alter table comissoes
  drop constraint if exists comissoes_status_vendedor_check;

alter table comissoes
  add constraint comissoes_status_vendedor_check
  check (status_vendedor in ('Pendente', 'Recebido', 'Cancelado'));

-- === supabase/migrations/20260529_rls_tabelas_admin.sql ===
-- ── mapeamentos_importacao: habilita RLS, admin-only ─────────────────────────
alter table mapeamentos_importacao enable row level security;

drop policy if exists "mapeamentos_admin" on mapeamentos_importacao;
drop policy if exists "mapeamentos_admin" on mapeamentos_importacao;
create policy "mapeamentos_admin" on mapeamentos_importacao
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- ── importacoes_comissao: habilita RLS, admin-only ───────────────────────────
alter table importacoes_comissao enable row level security;

drop policy if exists "importacoes_admin" on importacoes_comissao;
drop policy if exists "importacoes_admin" on importacoes_comissao;
create policy "importacoes_admin" on importacoes_comissao
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- ── niveis_vendedor: corrige policies (somente admin pode escrever) ──────────
-- Remove as policies abertas para todos os autenticados
drop policy if exists "auth_insert_niveis_vendedor" on niveis_vendedor;
drop policy if exists "auth_update_niveis_vendedor" on niveis_vendedor;
drop policy if exists "auth_delete_niveis_vendedor" on niveis_vendedor;

-- Adiciona policy admin para escrita (leitura já existe via auth_select_niveis_vendedor)
drop policy if exists "niveis_vendedor_admin_escrita" on niveis_vendedor;
drop policy if exists "niveis_vendedor_admin_escrita" on niveis_vendedor;
create policy "niveis_vendedor_admin_escrita" on niveis_vendedor
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- === supabase/migrations/20260529_fix_rls_regras_comissao.sql ===
-- Reverte policies abertas (for all to authenticated) em tabelas de configuração
-- de comissão de volta para admin-only, impedindo vendedores de alterar regras.

-- ── regras_comissao ──────────────────────────────────────────────────────────
drop policy if exists "regras_comissao_auth"  on regras_comissao;
drop policy if exists "regras_comissao_admin" on regras_comissao;

drop policy if exists "regras_comissao_admin" on regras_comissao;
create policy "regras_comissao_admin" on regras_comissao
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- Vendedores precisam ler regras para calcular comissões na interface
drop policy if exists "regras_comissao_vendedor_leitura" on regras_comissao;
create policy "regras_comissao_vendedor_leitura" on regras_comissao
  for select
  to authenticated
  using (true);

-- ── parcelas_regra ───────────────────────────────────────────────────────────
drop policy if exists "parcelas_regra_auth"  on parcelas_regra;
drop policy if exists "parcelas_regra_admin" on parcelas_regra;

drop policy if exists "parcelas_regra_admin" on parcelas_regra;
create policy "parcelas_regra_admin" on parcelas_regra
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

drop policy if exists "parcelas_regra_vendedor_leitura" on parcelas_regra;
create policy "parcelas_regra_vendedor_leitura" on parcelas_regra
  for select
  to authenticated
  using (true);

-- ── repasse_grupo_vendedor ───────────────────────────────────────────────────
drop policy if exists "repasse_grupo_vendedor_auth"  on repasse_grupo_vendedor;
drop policy if exists "repasse_grupo_vendedor_admin" on repasse_grupo_vendedor;

drop policy if exists "repasse_grupo_vendedor_admin" on repasse_grupo_vendedor;
create policy "repasse_grupo_vendedor_admin" on repasse_grupo_vendedor
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

drop policy if exists "repasse_grupo_vendedor_vendedor_leitura" on repasse_grupo_vendedor;
create policy "repasse_grupo_vendedor_vendedor_leitura" on repasse_grupo_vendedor
  for select
  to authenticated
  using (true);

-- === supabase/migrations/20260529_fix_tipos_agenda_rls.sql ===
-- Remove policy "for all to authenticated" que permite DELETE de tipos_agenda.
-- Mantém leitura para todos autenticados; escrita (INSERT/UPDATE/DELETE) apenas admin.

drop policy if exists "tipos_agenda_todos"   on tipos_agenda;
drop policy if exists "tipos_agenda_leitura" on tipos_agenda;
drop policy if exists "tipos_agenda_admin"   on tipos_agenda;

-- Leitura para todos autenticados (necessário para exibir lista no formulário)
drop policy if exists "tipos_agenda_leitura" on tipos_agenda;
create policy "tipos_agenda_leitura" on tipos_agenda
  for select
  to authenticated
  using (true);

-- Escrita exclusiva para admin
drop policy if exists "tipos_agenda_admin" on tipos_agenda;
create policy "tipos_agenda_admin" on tipos_agenda
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- === supabase/migrations/20260529_rls_documentos_cliente.sql ===
-- supabase/migrations/20260529_rls_documentos_cliente.sql
-- Habilita RLS em documentos_cliente espelhando as policies de clientes:
-- admin vê tudo; vendedor acessa apenas documentos dos próprios clientes.
-- Também cria storage policies para o bucket clientes-documentos.

-- ── Tabela documentos_cliente ──
alter table documentos_cliente enable row level security;

drop policy if exists "documentos_admin_tudo" on documentos_cliente;
drop policy if exists "documentos_admin_tudo" on documentos_cliente;
create policy "documentos_admin_tudo" on documentos_cliente
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

drop policy if exists "documentos_vendedor_proprios" on documentos_cliente;
drop policy if exists "documentos_vendedor_proprios" on documentos_cliente;
create policy "documentos_vendedor_proprios" on documentos_cliente
  for select
  using (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from clientes c
      where c.id = documentos_cliente.cliente_id
        and c.vendedor_id = meu_vendedor_id()
    )
  );

drop policy if exists "documentos_vendedor_insert" on documentos_cliente;
drop policy if exists "documentos_vendedor_insert" on documentos_cliente;
create policy "documentos_vendedor_insert" on documentos_cliente
  for insert
  with check (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from clientes c
      where c.id = documentos_cliente.cliente_id
        and c.vendedor_id = meu_vendedor_id()
    )
  );

drop policy if exists "documentos_vendedor_delete" on documentos_cliente;
drop policy if exists "documentos_vendedor_delete" on documentos_cliente;
create policy "documentos_vendedor_delete" on documentos_cliente
  for delete
  using (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from clientes c
      where c.id = documentos_cliente.cliente_id
        and c.vendedor_id = meu_vendedor_id()
    )
  );

-- ── Storage: bucket clientes-documentos ─────────────────────────────────────
-- Arquivos são armazenados no caminho: {cliente_id}/{nome_arquivo}
-- Admin: acesso total ao bucket





-- Vendedor: acessa apenas arquivos do próprio cliente
-- O caminho é {cliente_id}/{arquivo}, então split_part(name,'/',1) = cliente_id





-- === supabase/migrations/20260529_cascade_delete_vitalicio.sql ===
-- Quando um cliente vitalício é apagado, apagar automaticamente
-- todas as contas mensais geradas para ele.
-- Antes era ON DELETE SET NULL — as contas ficavam órfãs.

ALTER TABLE contas
  DROP CONSTRAINT IF EXISTS contas_cliente_vitalicio_id_fkey;

ALTER TABLE contas
  ADD CONSTRAINT contas_cliente_vitalicio_id_fkey
    FOREIGN KEY (cliente_vitalicio_id)
    REFERENCES clientes(id)
    ON DELETE CASCADE;

-- Limpar contas órfãs que ficaram com cliente_vitalicio_id = NULL
-- (geradas antes desta correção, cujo cliente já foi apagado)
DELETE FROM contas
WHERE cliente_vitalicio_id IS NULL
  AND categoria = 'Vitalício';

-- === supabase/migrations/20260529_code_review_fixes.sql ===
-- Correções apontadas pelo code review:
-- 1. comissoes_vendedor_delete: bloqueia deleção de comissões já pagas
-- 2. trigger vendas: dispara em INSERT e UPDATE (não só INSERT)
-- 3. vendedores.nome: unique constraint para evitar backfill não-determinístico
-- 4. remove policy vendas_vendedor_select duplicada (mantém só vendas_vendedor_proprios)

-- ── 1. comissoes_vendedor_delete: não permite apagar comissão já recebida ────
-- Sem este guard, um vendedor poderia deletar uma comissão paga e re-inserir
-- como Pendente para cobrar de novo.
DROP POLICY IF EXISTS "comissoes_vendedor_delete" ON comissoes;

drop policy if exists "comissoes_vendedor_delete" on comissoes;
CREATE POLICY "comissoes_vendedor_delete" ON comissoes
  FOR DELETE
  USING (
    meu_perfil() = 'vendedor'
    AND status_empresa != 'Recebido'
    AND status_vendedor != 'Recebido'
    AND EXISTS (
      SELECT 1 FROM vendas v
      WHERE v.id = comissoes.venda_id
        AND v.vendedor_id = meu_vendedor_id()
    )
  );

-- ── 2. Trigger: atualiza vendedor_id também em UPDATE (não só INSERT) ────────
DROP TRIGGER IF EXISTS trg_vendas_set_vendedor_id ON vendas;

CREATE TRIGGER trg_vendas_set_vendedor_id
  BEFORE INSERT OR UPDATE ON vendas
  FOR EACH ROW EXECUTE FUNCTION set_venda_vendedor_id();

-- ── 3. Unique constraint em vendedores.nome ───────────────────────────────────
-- Aplicado apenas se não há duplicatas — caso existam, o admin deve resolver
-- manualmente antes de retentar.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT nome FROM vendedores GROUP BY nome HAVING COUNT(*) > 1
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'vendedores_nome_unique'
    ) THEN
      ALTER TABLE vendedores ADD CONSTRAINT vendedores_nome_unique UNIQUE (nome);
    END IF;
  ELSE
    RAISE NOTICE 'ATENÇÃO: existem vendedores com o mesmo nome. Resolva os duplicados antes de adicionar a constraint UNIQUE.';
  END IF;
END;
$$;

-- ── 4. Remove policy SELECT duplicada em vendas ───────────────────────────────
-- 20260528_reset_rls criou "vendas_vendedor_select"; 20260530 criou
-- "vendas_vendedor_proprios" com a mesma lógica. Remove a antiga.
DROP POLICY IF EXISTS "vendas_vendedor_select" ON vendas;

-- === supabase/migrations/20260530_fix_rls_despesas_categorias.sql ===
-- Remove as policies abertas (to authenticated using(true)) de despesas_fixas e
-- categorias_despesa que permitiam que qualquer vendedor criasse, editasse e
-- excluísse registros financeiros. As policies admin-only (despesas_fixas_admin e
-- categorias_despesa_admin) já existem — apenas as abertas precisam ser removidas.

-- ── despesas_fixas ────────────────────────────────────────────────────────────
drop policy if exists "auth_select_despesas_fixas" on despesas_fixas;
drop policy if exists "auth_insert_despesas_fixas" on despesas_fixas;
drop policy if exists "auth_update_despesas_fixas" on despesas_fixas;
drop policy if exists "auth_delete_despesas_fixas" on despesas_fixas;

-- Leitura para todos autenticados (necessária para exibir despesas no financeiro)
drop policy if exists "despesas_fixas_leitura" on despesas_fixas;
drop policy if exists "despesas_fixas_leitura" on despesas_fixas;
create policy "despesas_fixas_leitura" on despesas_fixas
  for select
  to authenticated
  using (true);

-- ── categorias_despesa ────────────────────────────────────────────────────────
drop policy if exists "auth_select_categorias_despesa" on categorias_despesa;
drop policy if exists "auth_insert_categorias_despesa" on categorias_despesa;
drop policy if exists "auth_update_categorias_despesa" on categorias_despesa;
drop policy if exists "auth_delete_categorias_despesa" on categorias_despesa;

-- Leitura para todos autenticados (necessária para exibir categorias no formulário)
drop policy if exists "categorias_despesa_leitura" on categorias_despesa;
drop policy if exists "categorias_despesa_leitura" on categorias_despesa;
create policy "categorias_despesa_leitura" on categorias_despesa
  for select
  to authenticated
  using (true);

-- === supabase/migrations/20260530_vendedor_write_vendas_comissoes.sql ===
-- vendas.vendedor_id nunca foi aplicada à produção (20260523_usuarios_permissoes.sql
-- foi parcialmente executada). A coluna precisa existir antes das policies.

-- ── 1. Garante que a coluna existe ───────────────────────────────────────────
alter table vendas
  add column if not exists vendedor_id uuid references vendedores(id);

-- ── 2. Preenche retroativamente ──────────────────────────────────────────────
-- Prioridade: pelo cliente (mais confiável)
update vendas
  set vendedor_id = c.vendedor_id
  from clientes c
  where vendas.cliente_id = c.id
    and c.vendedor_id is not null
    and vendas.vendedor_id is null;

-- Fallback: pelo nome do vendedor no campo texto
update vendas
  set vendedor_id = v.id
  from vendedores v
  where vendas.vendedor = v.nome
    and vendas.vendedor_id is null;

-- ── 3. Recria policy SELECT (pode estar quebrada ou inexistente) ──────────────
drop policy if exists "vendas_vendedor_proprios" on vendas;
drop policy if exists "vendas_vendedor_proprios" on vendas;
create policy "vendas_vendedor_proprios" on vendas
  for select
  using (
    meu_perfil() = 'vendedor'
    and vendedor_id = meu_vendedor_id()
  );

-- ── 4. INSERT: vendedor cria apenas vendas próprias ──────────────────────────
drop policy if exists "vendas_vendedor_insert" on vendas;
drop policy if exists "vendas_vendedor_insert" on vendas;
create policy "vendas_vendedor_insert" on vendas
  for insert
  with check (
    meu_perfil() = 'vendedor'
    and vendedor_id = meu_vendedor_id()
  );

-- ── 5. UPDATE: vendedor edita apenas vendas próprias, sem reatribuição ───────
drop policy if exists "vendas_vendedor_update" on vendas;
drop policy if exists "vendas_vendedor_update" on vendas;
create policy "vendas_vendedor_update" on vendas
  for update
  using (
    meu_perfil() = 'vendedor'
    and vendedor_id = meu_vendedor_id()
  )
  with check (
    meu_perfil() = 'vendedor'
    and vendedor_id = meu_vendedor_id()
  );

-- ── 6. comissoes INSERT ───────────────────────────────────────────────────────
drop policy if exists "comissoes_vendedor_insert" on comissoes;
drop policy if exists "comissoes_vendedor_insert" on comissoes;
create policy "comissoes_vendedor_insert" on comissoes
  for insert
  with check (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from vendas v
      where v.id = comissoes.venda_id
        and v.vendedor_id = meu_vendedor_id()
    )
  );

-- ── 7. comissoes DELETE (regeneração ao atualizar plano) ─────────────────────
drop policy if exists "comissoes_vendedor_delete" on comissoes;
drop policy if exists "comissoes_vendedor_delete" on comissoes;
create policy "comissoes_vendedor_delete" on comissoes
  for delete
  using (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from vendas v
      where v.id = comissoes.venda_id
        and v.vendedor_id = meu_vendedor_id()
    )
  );

-- ── 8. Recria policy SELECT de comissoes (pode referenciar vendedor_id inexistente) ──
drop policy if exists "comissoes_vendedor_proprios" on comissoes;
drop policy if exists "comissoes_vendedor_proprios" on comissoes;
create policy "comissoes_vendedor_proprios" on comissoes
  for select
  using (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from vendas v
      where v.id = comissoes.venda_id
        and v.vendedor_id = meu_vendedor_id()
    )
  );

-- UPDATE em comissoes permanece admin-only (marcar como recebido é operação financeira).

-- === supabase/migrations/20260530_trigger_vendas_vendedor_id.sql ===
-- Trigger BEFORE INSERT em vendas: preenche vendedor_id automaticamente a partir
-- do cliente vinculado, quando o payload não incluir o UUID.
-- Necessário porque o app envia apenas o campo texto "vendedor" (nome),
-- mas as policies RLS precisam de vendedor_id (uuid) para isolar por vendedor.

create or replace function set_venda_vendedor_id()
returns trigger language plpgsql security definer as $$
begin
  if new.vendedor_id is null and new.cliente_id is not null then
    select c.vendedor_id into new.vendedor_id
    from clientes c
    where c.id = new.cliente_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vendas_set_vendedor_id on vendas;
create trigger trg_vendas_set_vendedor_id
  before insert on vendas
  for each row execute function set_venda_vendedor_id();
