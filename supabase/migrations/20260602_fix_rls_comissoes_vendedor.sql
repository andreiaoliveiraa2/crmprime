-- Garante que RLS está ativo em comissoes e que as policies de vendedor
-- estão corretas. Remove todas as existentes e recria do zero para evitar
-- conflitos entre policies antigas e novas.

ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;

-- Remove todas as policies atuais da tabela
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'comissoes' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON comissoes';
  END LOOP;
END;
$$;

-- Admin vê e faz tudo
CREATE POLICY "comissoes_admin" ON comissoes
  FOR ALL
  USING  (meu_perfil() = 'admin')
  WITH CHECK (meu_perfil() = 'admin');

-- Vendedor só lê comissões das próprias vendas
CREATE POLICY "comissoes_vendedor_select" ON comissoes
  FOR SELECT
  USING (
    meu_perfil() = 'vendedor'
    AND EXISTS (
      SELECT 1 FROM vendas v
      WHERE v.id = comissoes.venda_id
        AND v.vendedor_id = meu_vendedor_id()
    )
  );

-- Vendedor pode inserir comissões apenas nas próprias vendas
CREATE POLICY "comissoes_vendedor_insert" ON comissoes
  FOR INSERT
  WITH CHECK (
    meu_perfil() = 'vendedor'
    AND EXISTS (
      SELECT 1 FROM vendas v
      WHERE v.id = comissoes.venda_id
        AND v.vendedor_id = meu_vendedor_id()
    )
  );

-- Vendedor pode apagar apenas comissões não recebidas das próprias vendas
CREATE POLICY "comissoes_vendedor_delete" ON comissoes
  FOR DELETE
  USING (
    meu_perfil() = 'vendedor'
    AND status_empresa != 'Recebido'
    AND status_vendedor != 'Recebido'
    AND EXISTS (
      SELECT 1 FROM vendas v
      WHERE v.id = comissoes.venda_id
        AND v.vendedor_id = meu_vendedor_id()
    )
  );
