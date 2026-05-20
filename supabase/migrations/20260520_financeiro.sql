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
