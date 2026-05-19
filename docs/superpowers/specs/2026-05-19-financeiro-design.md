# Módulo Financeiro — Design Spec
**Data:** 2026-05-19  
**Status:** Aprovado

---

## Objetivo

Controle financeiro focado em comissão, produção e recorrência para a A2 Prime Corretora de Seguros. O módulo tem 4 abas: Produção, Comissões, Contas, Relatórios.

---

## Banco de Dados

### Tabela `vendas`
Fonte de verdade para a aba Produção. Alimentada automaticamente quando um cliente com `valor_plano` é cadastrado, e manualmente via "Registrar Venda".

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| cliente_id | uuid FK clientes (nullable) | Nullable para vendas manuais sem cliente cadastrado |
| cliente_nome | text | Desnormalizado para exibição rápida |
| operadora | text | |
| valor_plano | numeric | |
| vendedor | text | |
| data_venda | date | |
| status | text | 'Ativo' \| 'Cancelado' |
| origem | text | 'cliente' \| 'manual' |
| criado_em | timestamptz | default now() |

### Tabela `regras_comissao`
Uma regra por operadora. Define como as comissões são calculadas.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| operadora | text | Deve corresponder a uma operadora cadastrada |
| percentual_total | numeric | Ex: 300 (= 300%) |
| num_parcelas | integer | |
| percentual_vitalicio | numeric | % mensal após encerrar parcelas |
| ativo | boolean | default true |
| criado_em | timestamptz | |

### Tabela `parcelas_regra`
Detalhamento de cada parcela dentro de uma regra.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| regra_id | uuid FK regras_comissao | |
| numero_parcela | integer | 1-based |
| percentual_empresa | numeric | % da parcela que fica com a empresa |
| percentual_vendedor | numeric | % da parcela que vai ao vendedor |

### Tabela `comissoes`
Uma linha por parcela (ou vitalício) por venda. Status rastreado separadamente para empresa e vendedor.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| venda_id | uuid FK vendas | |
| tipo | text | 'parcela' \| 'vitalicio' |
| numero_parcela | integer | Null para vitalício |
| valor_bruto | numeric | Valor total da comissão desta parcela |
| valor_empresa | numeric | Parte da empresa |
| valor_vendedor | numeric | Parte do vendedor |
| status_empresa | text | 'Pendente' \| 'Recebido' |
| status_vendedor | text | 'Pendente' \| 'Recebido' |
| data_prevista | date | |
| data_recebida_empresa | date | Nullable |
| data_recebida_vendedor | date | Nullable |
| criado_em | timestamptz | |

### Tabela `contas`
Contas a receber e a pagar. Independente do fluxo de vendas.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tipo | text | 'receber' \| 'pagar' |
| descricao | text | |
| valor | numeric | |
| vencimento | date | |
| status | text | 'Pendente' \| 'Recebido' \| 'Pago' |
| observacoes | text | Nullable |
| criado_em | timestamptz | |

### Tabela `mapeamentos_importacao`
Configuração de colunas salva por operadora. Reutilizada em importações futuras.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| operadora | text | |
| mapeamento | jsonb | Ex: `{"cliente_nome": "Nome Cliente", "valor": "Vlr Plano", ...}` |
| atualizado_em | timestamptz | |

### Tabela `importacoes_comissao`
Histórico de arquivos importados.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| operadora | text | |
| nome_arquivo | text | |
| total_registros | integer | |
| total_valor | numeric | |
| erros_count | integer | |
| erros_detalhe | jsonb | Lista de erros por linha |
| criado_em | timestamptz | |

---

## Fluxo Automático de Alimentação

**Cliente → Venda:**  
Quando `ClienteFormPosVenda` ou `ConversaoModal` salva um cliente com `valor_plano` preenchido, o código cria automaticamente um registro em `vendas` com `origem: 'cliente'`. Em atualizações, atualiza a venda existente com `origem: 'cliente'`.

**Venda → Comissões:**  
Ao criar uma `venda` (automática ou manual), o sistema verifica se existe `regra_comissao` para a operadora. Se sim, gera registros em `comissoes` — um por parcela (com valores calculados) mais um registro de vitalício com status recorrente. Todas as comissões iniciam com `status_empresa = 'Pendente'` e `status_vendedor = 'Pendente'`.

**Cálculo exemplo** (plano R$1.000, regra 300% em 3 parcelas + 2% vitalício):
- Parcela 1: valor_bruto = R$1.000 × (100%/300%) × 300% = R$1.000 → empresa 100% = R$1.000, vendedor 100% = R$1.000  
  *(percentuais definidos na `parcelas_regra` referem-se à parcela, não ao plano)*
- Na prática: `valor_bruto = valor_plano × (percentual_parcela / 100)`, onde cada parcela_regra define os splits.

---

## Arquitetura de Componentes

```
src/app/(protected)/financeiro/
  page.tsx                        ← server component, busca dados iniciais

src/components/
  FinanceiroClient.tsx            ← tab switcher (Produção/Comissões/Contas/Relatórios)
  ProducaoTab.tsx                 ← cards + tabela + gráfico barras CSS
  ComissoesTab.tsx                ← visão geral + tabela + regras + importação
  ContasTab.tsx                   ← contas a receber + contas a pagar
  RelatoriosTab.tsx               ← relatórios por período + exportação
  RegistrarVendaModal.tsx         ← modal para registrar venda manual
  RegraComissaoModal.tsx          ← modal criar/editar regra por operadora
  MapearColunasModal.tsx          ← configuração de colunas por operadora (salva)
  ImportarComissaoModal.tsx       ← upload + preview + confirmação de importação
```

O `page.tsx` (server) carrega dados iniciais e passa props para `FinanceiroClient`. Navegação entre abas é client-side (sem reload).

---

## Aba Produção

### Cards (4)
- **Produção do Mês:** `SUM(vendas.valor_plano)` onde `data_venda` no mês corrente
- **Comissão a Receber:** `SUM(comissoes.valor_empresa)` onde `status_empresa = 'Pendente'`
- **Vitalícios Ativos:** `COUNT(DISTINCT venda_id)` onde `tipo = 'vitalicio'` e `status_empresa = 'Pendente'`
- **Contas a Pagar:** `SUM(contas.valor)` onde `tipo = 'pagar'`, `status = 'Pendente'` e `vencimento` no mês corrente

### Tabela de Vendas
Colunas: Cliente | Operadora | Valor do Plano | Vendedor | Data | Status  
Filtros: operadora, vendedor, período (data início/fim)  
Ações: editar venda, cancelar venda  
Exportação: Excel (.xlsx) e PDF

### Gráfico
Barras horizontais em CSS por operadora — valor total produzido. Calculado a partir das vendas filtradas do período.

### "Registrar Venda" modal
Campos: Cliente (busca por nome em `clientes`), Operadora (lista de `operadoras`), Valor do Plano, Vendedor (lista de `vendedores`), Data da Venda.  
Ao salvar: cria `venda` com `origem: 'manual'` e gera comissões automaticamente se houver regra.

---

## Aba Comissões

### Cards (3)
- Total Recebido (empresa + vendedor combinados, período)
- A Receber (empresa pendente + vendedor pendente)
- Vitalícios Ativos (valor mensal total — soma dos valores de vitalício com status pendente)

### Tabela de Comissões
Cada linha é uma comissão (parcela ou vitalício) vinculada a uma venda:

| Coluna | Detalhe |
|---|---|
| Cliente | Nome do cliente da venda |
| Operadora | |
| Tipo | "Parcela 1", "Parcela 2", ..., "Vitalício" |
| Valor Bruto | Valor total da comissão |
| Valor Empresa | Parte da empresa |
| Status Empresa | Badge Pendente/Recebido — clicável para marcar como recebido |
| Valor Vendedor | Parte do vendedor |
| Status Vendedor | Badge Pendente/Recebido — clicável para marcar como recebido |
| Data Prevista | |

Filtros: operadora, vendedor, tipo (parcela/vitalício), status empresa, status vendedor, período.

### Regras de Comissão
Seção inferior ou painel lateral com lista de regras por operadora.  
Botão "+ Nova Regra" → `RegraComissaoModal`:
- Campo operadora (select)
- Percentual total e nº de parcelas
- Tabela inline: para cada parcela — % empresa e % vendedor
- Campo % vitalício
- Validação: soma dos percentuais deve ser consistente

Regras existentes: editar, ativar/desativar, excluir (apenas se não houver comissões geradas).

### Importação de Relatório
Fluxo em `ImportarComissaoModal`:
1. Selecionar arquivo (.xlsx ou .csv) + selecionar operadora
2. **Se mapeamento existente:** pré-visualiza primeiras linhas com colunas mapeadas
3. **Se sem mapeamento:** exibe `MapearColunasModal` — lista campos do sistema (cliente_nome, operadora, valor, vendedor, data) × colunas detectadas no arquivo; salva em `mapeamentos_importacao`
4. Preview: tabela com registros a importar + alertas de linhas com erro
5. Confirmar → insere comissões, exibe resumo (qtd importados, valor total, qtd erros)
6. Registro salvo em `importacoes_comissao`

Histórico: tabela com importações anteriores — data, operadora, arquivo, registros, erros.

---

## Aba Contas

Duas seções empilhadas (mobile) ou lado a lado (desktop ≥ lg):

### Contas a Receber
Card com total pendente no topo.  
Tabela: Descrição | Valor | Vencimento | Status (badge, clicável: Pendente ↔ Recebido) | Ações (editar, excluir)  
Itens com vencimento passado e status Pendente destacados em vermelho.  
Botão "+ Adicionar Conta a Receber"

### Contas a Pagar
Mesma estrutura. Status: Pendente ↔ Pago.  
Botão "+ Adicionar Conta a Pagar"

Filtros compartilhados: status, período de vencimento.

---

## Aba Relatórios

Filtro de período no topo (mês/ano ou datas customizadas).

### Relatórios disponíveis
1. **Vendas do período** — quantidade e valor total, breakdown por operadora
2. **Comissão por vendedor** — tabela: Vendedor | Valor Recebido | % sobre produção
3. **Retenção da empresa** — quanto ficou com a empresa no período
4. **Vitalícios ativos** — tabela: Cliente | Operadora | Valor mensal empresa | Valor mensal vendedor
5. **Pendências financeiras** — comissões pendentes + contas vencidas não pagas

Exportação: botão "Exportar Excel" e "Exportar PDF" com os dados do filtro ativo.

---

## Visual
- Fundo: `#f4f1ec`, cards brancos, roxo `#2d1f4e`, dourado `#b89a6a`
- Padrão A2 Prime — consistente com CRM, Clientes e Agenda
- Responsivo: mobile-first, abas com scroll horizontal se necessário

---

## Fora do escopo desta versão
- Integração direta com APIs das operadoras
- Notificações automáticas de vencimento
- Multi-empresa / multi-corretora
