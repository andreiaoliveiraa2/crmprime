-- Campos de fase e vitalício na tabela de clientes
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS fase_cliente text NOT NULL DEFAULT 'ativo'
    CHECK (fase_cliente IN ('ativo', 'vitalicio')),
  ADD COLUMN IF NOT EXISTS vitalicio_valor_estimado numeric,
  ADD COLUMN IF NOT EXISTS vitalicio_dia_previsto integer CHECK (vitalicio_dia_previsto BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS vitalicio_inicio date;

-- Referência ao cliente vitalício na tabela de contas
ALTER TABLE contas
  ADD COLUMN IF NOT EXISTS cliente_vitalicio_id uuid REFERENCES clientes(id) ON DELETE SET NULL;

-- Índice para busca rápida de contas do vitalício
CREATE INDEX IF NOT EXISTS idx_contas_cliente_vitalicio ON contas(cliente_vitalicio_id);
