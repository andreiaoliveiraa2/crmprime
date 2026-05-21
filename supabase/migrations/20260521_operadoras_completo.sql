-- 1. Enriquecer tabela operadoras
ALTER TABLE operadoras
  ADD COLUMN IF NOT EXISTS cnpj         text,
  ADD COLUMN IF NOT EXISTS telefone     text,
  ADD COLUMN IF NOT EXISTS email_gestor text,
  ADD COLUMN IF NOT EXISTS site         text,
  ADD COLUMN IF NOT EXISTS empresa      text,
  ADD COLUMN IF NOT EXISTS observacoes  text;

-- 2. Enriquecer regras_comissao
ALTER TABLE regras_comissao
  ADD COLUMN IF NOT EXISTS desconta_imposto   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS percentual_imposto numeric  DEFAULT 0;

-- 3. Nova tabela de repasse por nível de vendedor
CREATE TABLE IF NOT EXISTS repasse_grupo_vendedor (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regra_id   uuid NOT NULL REFERENCES regras_comissao(id) ON DELETE CASCADE,
  nivel      text NOT NULL,
  percentual numeric NOT NULL DEFAULT 0,
  UNIQUE(regra_id, nivel)
);
