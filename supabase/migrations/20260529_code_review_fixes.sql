-- Correções apontadas pelo code review:
-- 1. comissoes_vendedor_delete: bloqueia deleção de comissões já pagas
-- 2. trigger vendas: dispara em INSERT e UPDATE (não só INSERT)
-- 3. vendedores.nome: unique constraint para evitar backfill não-determinístico
-- 4. remove policy vendas_vendedor_select duplicada (mantém só vendas_vendedor_proprios)

-- ── 1. comissoes_vendedor_delete: não permite apagar comissão já recebida ────
-- Sem este guard, um vendedor poderia deletar uma comissão paga e re-inserir
-- como Pendente para cobrar de novo.
DROP POLICY IF EXISTS "comissoes_vendedor_delete" ON comissoes;

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

-- ── 2. Trigger: atualiza vendedor_id também em UPDATE (não só INSERT) ────────
DROP TRIGGER IF EXISTS trg_vendas_set_vendedor_id ON vendas;

CREATE TRIGGER trg_vendas_set_vendedor_id
  BEFORE INSERT OR UPDATE ON vendas
  FOR EACH ROW EXECUTE FUNCTION set_venda_vendedor_id();

-- ── 3. Unique constraint em vendedores.nome ───────────────────────────────────
-- Aplicado apenas se não há duplicatas — caso existam, o admin deve resolver
-- manualmente antes de retentar.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT nome FROM vendedores GROUP BY nome HAVING COUNT(*) > 1
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'vendedores_nome_unique'
    ) THEN
      ALTER TABLE vendedores ADD CONSTRAINT vendedores_nome_unique UNIQUE (nome);
    END IF;
  ELSE
    RAISE NOTICE 'ATENÇÃO: existem vendedores com o mesmo nome. Resolva os duplicados antes de adicionar a constraint UNIQUE.';
  END IF;
END;
$$;

-- ── 4. Remove policy SELECT duplicada em vendas ───────────────────────────────
-- 20260528_reset_rls criou "vendas_vendedor_select"; 20260530 criou
-- "vendas_vendedor_proprios" com a mesma lógica. Remove a antiga.
DROP POLICY IF EXISTS "vendas_vendedor_select" ON vendas;
