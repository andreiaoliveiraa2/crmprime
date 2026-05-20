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
insert into storage.buckets (id, name, public)
values ('clientes-documentos', 'clientes-documentos', false)
on conflict do nothing;
