-- supabase/migrations/20260522_cnpjs_recebimento.sql

-- 1. Tabela de CNPJs de Recebimento
CREATE TABLE IF NOT EXISTS cnpjs_recebimento (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL,
  razao_social text,
  cnpj         text,
  banco        text,
  agencia      text,
  conta        text,
  tipo_conta   text,
  pix          text,
  status       text NOT NULL DEFAULT 'Ativo',
  criado_em    timestamptz NOT NULL DEFAULT now()
);

-- 2. Dados iniciais — os 3 CNPJs existentes
INSERT INTO cnpjs_recebimento (nome) VALUES
  ('A2 Prime'),
  ('A2 Corretora'),
  ('MEI')
ON CONFLICT DO NOTHING;

-- 3. Adicionar cnpj_recebimento_id em regras_comissao
ALTER TABLE regras_comissao
  ADD COLUMN IF NOT EXISTS cnpj_recebimento_id uuid REFERENCES cnpjs_recebimento(id);

-- 4. Adicionar cnpj_recebimento_id em vendas
ALTER TABLE vendas
  ADD COLUMN IF NOT EXISTS cnpj_recebimento_id uuid REFERENCES cnpjs_recebimento(id);
