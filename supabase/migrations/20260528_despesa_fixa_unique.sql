-- Índice único para evitar race condition na geração de contas de despesas fixas.
-- A geração ocorre no page load do Financeiro; sem este índice, dois acessos simultâneos
-- duplicam todas as contas do mês. Espelha idx_contas_vitalicio_mes_unico (carteira vitalícia).
create unique index if not exists idx_contas_despesa_fixa_mes_unico
  on contas (despesa_fixa_id, date_trunc('month', vencimento::timestamp))
  where despesa_fixa_id is not null;
