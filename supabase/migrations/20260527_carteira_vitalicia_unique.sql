-- Índice único: cada cliente vitalício só pode ter uma conta a receber por mês
-- Protege contra race condition quando dois usuários carregam /financeiro ao mesmo tempo
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_vitalicio_mes_unico
  ON contas (cliente_vitalicio_id, date_trunc('month', vencimento::timestamp))
  WHERE cliente_vitalicio_id IS NOT NULL;
