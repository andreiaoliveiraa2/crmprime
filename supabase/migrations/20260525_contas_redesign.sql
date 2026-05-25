-- contas: suporte a tipos de lançamento e agrupamento de parcelas
alter table contas
  add column if not exists tipo_lancamento text not null default 'unica'
    check (tipo_lancamento in ('unica', 'parcelada', 'recorrente')),
  add column if not exists grupo_id       uuid,
  add column if not exists parcela_numero integer,
  add column if not exists total_parcelas integer;

-- categorias_despesa: tipo padrão por categoria
alter table categorias_despesa
  add column if not exists tipo_padrao text not null default 'unica'
    check (tipo_padrao in ('unica', 'recorrente'));

-- Atualizar tipo_padrao das categorias padrão
update categorias_despesa set tipo_padrao = 'recorrente'
  where nome in ('Aluguel','Internet','Telefone','Contador','Sistema','Salário');

update categorias_despesa set tipo_padrao = 'unica'
  where nome in ('Imposto','Outros');

-- contas geradas por despesas_fixas existentes marcadas como recorrente
update contas set tipo_lancamento = 'recorrente'
  where despesa_fixa_id is not null;
