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
