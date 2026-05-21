# Gestão — Produção por Vendedor (v2)

**Data:** 2026-05-21  
**Projeto:** CRM Seguros — A2 Prime  
**Status:** Aprovado

---

## Objectivo

1. Remover vitalício do módulo Gestão (é exclusivo da corretora, não do vendedor).
2. Expandir a ficha do vendedor com uma tab de Produção — métricas filtráveis de vendas e comissões.

---

## Decisões de Design

- **Vitalício:** removido da UI e dos cálculos do vendedor. As colunas `tem_vitalicio` e `percentual_vitalicio` ficam na base de dados (sem apagar dados), mas deixam de aparecer no formulário e na ficha.
- **Tabs:** `/gestao/[id]` passa a ter duas abas — "Dados Cadastrais" e "Produção".
- **Filtragem:** client-side com os dados já carregados no servidor (sem chamadas adicionais ao Supabase ao mudar filtros).
- **Período padrão:** primeiro dia do mês atual até hoje.

---

## Ficheiros Modificados

| Ficheiro | Alteração |
|---|---|
| `src/lib/types.ts` | Remover `tem_vitalicio` e `percentual_vitalicio` da interface `Vendedor` |
| `src/components/VendedorForm.tsx` | Remover campos e estado de vitalício da secção Repasse |
| `src/components/FichaVendedor.tsx` | Adicionar tabs; mover dados cadastrais para Tab 1; criar Tab 2 de Produção |

Nenhum ficheiro novo criado. Nenhuma migration necessária.

---

## Tab 1 — Dados Cadastrais

Conteúdo actual da ficha, sem alterações excepto:
- Remover `Campo` "Tem vitalício" e "Percentual do vitalício" do card "Configuração de Repasse".

---

## Tab 2 — Produção

### Filtros (acima dos cards)

| Filtro | Tipo | Padrão |
|---|---|---|
| Data início | date input | 1º dia do mês actual |
| Data fim | date input | Hoje |
| Operadora | select | Todas |

A lista de operadoras no select é derivada dinamicamente das vendas do vendedor (sem valores fixos).

### Cards de Resumo (4 cards, recalculados ao mudar filtros)

| Card | Cálculo |
|---|---|
| Total produzido no período | `sum(valor_plano)` das vendas filtradas |
| Nº de vendas | `count` das vendas filtradas |
| Comissões pagas | `sum(valor_vendedor)` onde `status_vendedor = 'Recebido'` das comissões das vendas filtradas |
| Comissões pendentes | `sum(valor_vendedor)` onde `status_vendedor = 'Pendente'` das comissões das vendas filtradas |

### Tabela por Operadora

Agrupamento das vendas filtradas por operadora.

| Coluna | Fonte |
|---|---|
| Operadora | `venda.operadora` |
| Nº vendas | count |
| Total produzido | `sum(valor_plano)` |
| % do total | `(total_operadora / total_geral) * 100` |

### Lista de Vendas

Tabela com todas as vendas do vendedor após aplicação dos filtros.

| Coluna | Fonte |
|---|---|
| Cliente | `venda.cliente_nome` |
| Operadora | `venda.operadora` |
| Valor | `venda.valor_plano` |
| Data | `venda.data_venda` |
| Status | `venda.status` (badge Ativo/Cancelado) |

---

## Fora de Âmbito

- Metas mensais por vendedor (próxima sessão)
- Ranking de vendedores (próxima sessão)
- Extrato exportável Excel/PDF (próxima sessão)
- Remoção das colunas `tem_vitalicio` / `percentual_vitalicio` da base de dados
