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
