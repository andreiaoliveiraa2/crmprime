-- Apaga TODAS as policies de clientes e vendas (inclusive não documentadas)
-- e recria apenas as corretas.

-- ─── Remove todas as policies de clientes ────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'clientes' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON clientes';
  END LOOP;
END;
$$;

-- ─── Remove todas as policies de vendas ──────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'vendas' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON vendas';
  END LOOP;
END;
$$;

-- ─── Garante que RLS está habilitado ─────────────────────────────────────────
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas   ENABLE ROW LEVEL SECURITY;

-- ─── Policies de CLIENTES ─────────────────────────────────────────────────────
CREATE POLICY "clientes_admin_tudo" ON clientes
  FOR ALL USING (meu_perfil() = 'admin')
  WITH CHECK (meu_perfil() = 'admin');

CREATE POLICY "clientes_vendedor_select" ON clientes
  FOR SELECT USING (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  );

CREATE POLICY "clientes_vendedor_insert" ON clientes
  FOR INSERT WITH CHECK (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  );

CREATE POLICY "clientes_vendedor_update" ON clientes
  FOR UPDATE
  USING (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  )
  WITH CHECK (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  );

-- ─── Policies de VENDAS ───────────────────────────────────────────────────────
CREATE POLICY "vendas_admin" ON vendas
  FOR ALL USING (meu_perfil() = 'admin')
  WITH CHECK (meu_perfil() = 'admin');

CREATE POLICY "vendas_vendedor_select" ON vendas
  FOR SELECT USING (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  );

CREATE POLICY "vendas_vendedor_insert" ON vendas
  FOR INSERT WITH CHECK (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  );

CREATE POLICY "vendas_vendedor_update" ON vendas
  FOR UPDATE
  USING (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  )
  WITH CHECK (
    meu_perfil() = 'vendedor'
    AND vendedor_id = meu_vendedor_id()
  );
