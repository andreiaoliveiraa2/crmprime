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
