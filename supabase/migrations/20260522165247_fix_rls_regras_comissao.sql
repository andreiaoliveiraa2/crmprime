-- Fix: habilitar políticas RLS para regras_comissao e tabelas relacionadas
-- Problema: RLS estava habilitado mas sem policies — bloqueava todo INSERT/UPDATE/DELETE

-- 1. regras_comissao: permitir acesso total a usuários autenticados
alter table regras_comissao enable row level security;

drop policy if exists "regras_comissao_auth" on regras_comissao;
create policy "regras_comissao_auth" on regras_comissao
  for all to authenticated using (true) with check (true);

-- 2. parcelas_regra: mesma política
alter table parcelas_regra enable row level security;

drop policy if exists "parcelas_regra_auth" on parcelas_regra;
create policy "parcelas_regra_auth" on parcelas_regra
  for all to authenticated using (true) with check (true);

-- 3. repasse_grupo_vendedor: mesma política
alter table repasse_grupo_vendedor enable row level security;

drop policy if exists "repasse_grupo_vendedor_auth" on repasse_grupo_vendedor;
create policy "repasse_grupo_vendedor_auth" on repasse_grupo_vendedor
  for all to authenticated using (true) with check (true);

-- 4. Remover unique constraint em operadora (incompatível com múltiplas regras por CNPJ)
alter table regras_comissao drop constraint if exists regras_comissao_operadora_key;

-- 5. Nova constraint: única por (operadora + cnpj_recebimento_id)
alter table regras_comissao
  drop constraint if exists regras_comissao_operadora_cnpj_key;
alter table regras_comissao
  add constraint regras_comissao_operadora_cnpj_key
  unique (operadora, cnpj_recebimento_id);
