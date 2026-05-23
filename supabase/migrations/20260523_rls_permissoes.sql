-- supabase/migrations/20260523_rls_permissoes.sql
-- Executar APÓS as admins serem cadastradas em usuarios

-- ── LEADS ──
alter table leads enable row level security;

create policy "leads_admin_tudo" on leads
  for all using (meu_perfil() = 'admin');

create policy "leads_vendedor_proprios" on leads
  for select using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

create policy "leads_vendedor_insert" on leads
  for insert with check (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

create policy "leads_vendedor_update" on leads
  for update using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

-- ── CLIENTES ──
alter table clientes enable row level security;

create policy "clientes_admin_tudo" on clientes
  for all using (meu_perfil() = 'admin');

create policy "clientes_vendedor_proprios" on clientes
  for select using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

create policy "clientes_vendedor_insert" on clientes
  for insert with check (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

create policy "clientes_vendedor_update" on clientes
  for update using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

-- ── AGENDA ──
alter table agenda enable row level security;

create policy "agenda_admin_tudo" on agenda
  for all using (meu_perfil() = 'admin');

create policy "agenda_vendedor_proprios" on agenda
  for select using (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

create policy "agenda_vendedor_insert" on agenda
  for insert with check (
    meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id()
  );

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

create policy "vendas_admin"             on vendas             for all using (meu_perfil() = 'admin');
create policy "comissoes_admin"          on comissoes          for all using (meu_perfil() = 'admin');
create policy "contas_admin"             on contas             for all using (meu_perfil() = 'admin');
create policy "regras_comissao_admin"    on regras_comissao    for all using (meu_perfil() = 'admin');
create policy "parcelas_regra_admin"     on parcelas_regra     for all using (meu_perfil() = 'admin');
create policy "cnpjs_recebimento_admin"  on cnpjs_recebimento  for all using (meu_perfil() = 'admin');
create policy "categorias_despesa_admin" on categorias_despesa for all using (meu_perfil() = 'admin');
create policy "despesas_fixas_admin"     on despesas_fixas     for all using (meu_perfil() = 'admin');

-- ── TABELAS COMPARTILHADAS (leitura por todos autenticados) ──
alter table vendedores  enable row level security;
alter table operadoras  enable row level security;
alter table tipos_agenda enable row level security;

create policy "vendedores_leitura"   on vendedores   for select using (auth.role() = 'authenticated');
create policy "vendedores_admin"     on vendedores   for all    using (meu_perfil() = 'admin');
create policy "operadoras_leitura"   on operadoras   for select using (auth.role() = 'authenticated');
create policy "operadoras_admin"     on operadoras   for all    using (meu_perfil() = 'admin');
create policy "tipos_agenda_leitura" on tipos_agenda for select using (auth.role() = 'authenticated');
create policy "tipos_agenda_todos"   on tipos_agenda for all    using (auth.role() = 'authenticated');
