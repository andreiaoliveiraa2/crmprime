-- Corrige leads antigos que têm o nome do vendedor (campo texto) mas vendedor_id = null.
-- Faz o join pelo nome para preencher o UUID correto.
update leads l
set vendedor_id = v.id
from vendedores v
where l.vendedor_id is null
  and l.vendedor is not null
  and l.vendedor = v.nome;
