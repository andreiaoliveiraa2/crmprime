-- Marca regras com adesão direta ao vendedor (ex: Dental Center / odonto)
alter table regras_comissao
  add column if not exists adesao_direta boolean not null default false;

-- Adiciona status 'Direto' para comissões onde corretora não recebe (adesão odonto)
alter table comissoes
  drop constraint if exists comissoes_status_empresa_check;

alter table comissoes
  add constraint comissoes_status_empresa_check
  check (status_empresa in ('Pendente', 'Recebido', 'Direto'));
