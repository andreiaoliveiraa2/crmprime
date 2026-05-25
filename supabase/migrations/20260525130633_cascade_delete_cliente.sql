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
