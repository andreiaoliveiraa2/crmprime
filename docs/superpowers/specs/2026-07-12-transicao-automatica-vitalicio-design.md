# Transição automática venda → vitalício — Design

**Data:** 2026-07-12
**Pendência:** item 5 do checklist ("transição venda→vitalício automática na parcela 4; hoje é manual")

## Objetivo

Quando o admin dá baixa (marca "Recebido") na **última parcela** de comissão de um
cliente, o cliente vira fase **vitalício** sozinho — sem precisar abrir a ficha e
trocar a fase à mão.

## Como funciona hoje (contexto)

- Cada venda gera N parcelas em `comissoes` (tipo `'parcela'`, `numero_parcela`
  1..N; N vem de `regras_comissao.num_parcelas` da operadora).
- A baixa é feita em dois lugares do Financeiro (admin-only):
  `ContasTab.marcarRecebido()` e `ComissoesTab.toggleStatusEmpresa()` — os dois
  fazem `update` direto em `comissoes.status_empresa`.
- A virada manual é no form do cliente (fase → vitalício), que chama
  `cancelarVendasParaVitalicio` (cancela vendas ativas e comissões pendentes).
- O vitalício mensal do cliente roda por `clientes.vitalicio_valor_estimado` +
  `vitalicio_dia_previsto` (contas geradas por `gerarContasVitalicioPeriodo`).

## Decisões (Andreia, 12/07)

- **Gatilho:** na hora da baixa da última parcela (sem cron/checagem diária).
- **Valor mensal estimado:** calculado da regra da operadora
  (`percentual_vitalicio` × `valor_plano`). Se a regra não tiver % vitalício (> 0),
  fica `null` pra Andreia preencher (sem valor o cliente não entra na geração de
  contas mensais — comportamento já existente).
- **Des-baixa não desfaz:** desmarcar uma parcela depois NÃO volta o cliente pra
  fase ativo. Desfazer é manual (admin troca a fase na ficha).

## Design

### 1. Regra da virada

Após marcar uma comissão `tipo='parcela'` como `Recebido`, o cliente vira
vitalício **se e somente se**:

1. Todas as comissões `tipo='parcela'` de **todas as vendas ativas** do cliente
   estão com `status_empresa` em (`Recebido`, `Direto`) — nada `Pendente`.
   (Cliente com duas vendas — ex.: saúde + odonto — só vira quando as duas
   completarem; evita virar no meio de uma venda ainda pagando.)
2. O cliente está com `fase_cliente = 'ativo'` e `status = 'Ativo'`.

Ao virar:
- `fase_cliente = 'vitalicio'`
- `vitalicio_inicio = hoje` (se ainda null)
- `vitalicio_valor_estimado = valor_plano × percentual_vitalicio/100` da regra
  ativa da operadora do cliente; `null` se não houver % > 0. Não sobrescreve se o
  cliente já tiver valor preenchido.
- `vitalicio_dia_previsto = dia_vencimento_boleto` do cliente, senão `10`
  (mesmo fallback do `gerarContasVitalicioPeriodo`). Não sobrescreve se já houver.
- **A venda fica como está** (`status='Ativo'`): foi concluída, não cancelada.
  Nada de comissão é cancelado (não sobrou nada pendente).

### 2. Peças de código

**a) Lib pura `src/lib/transicaoVitalicio.ts`** (testável no Jest, padrão de
`calcularMetas.ts`):
- `todasParcelasRecebidas(comissoes): boolean` — recebe as comissões tipo parcela
  das vendas ativas do cliente e decide.
- `calcularVitalicioInicial({ valorPlano, percentualVitalicio, diaVencimentoBoleto, hoje })`
  → `{ vitalicio_valor_estimado, vitalicio_dia_previsto, vitalicio_inicio }`.

**b) Server action `src/app/actions/transicaoVitalicio.ts`:**
- `verificarTransicaoVitalicio(comissaoId: string): Promise<string | null>`
  (null = ok/nada a fazer; string = erro, padrão das actions existentes).
- Fluxo: carrega a comissão → se não for `tipo='parcela'`, sai. Carrega a venda →
  `cliente_id` (se null, sai). Verifica acesso via RLS (SELECT do cliente, mesmo
  padrão de `cancelarVendasParaVitalicio`), depois usa `createAdminClient()` pra
  ler as vendas ativas do cliente + todas as comissões parcela delas, aplica a
  regra da seção 1 e, se for o caso, faz o UPDATE do cliente.
- Busca da regra: `regras_comissao` ativa da operadora do cliente, mais recente
  (mesma query do `gerarComissoes` do form).

**c) Chamadas (2 pontos):**
- `ContasTab.marcarRecebido()` → após o update, `await verificarTransicaoVitalicio(c.id)`.
- `ComissoesTab.toggleStatusEmpresa()` → só quando `novoStatus === 'Recebido'`.
- Nos dois casos o retorno de erro não bloqueia a baixa (a baixa já aconteceu);
  erro vai pro `console.error` e a virada pode ser feita manualmente.

### 3. Casos de borda

- Comissão sem venda (`venda_id` null) ou venda sem `cliente_id` (vendas antigas/
  importadas): sai sem fazer nada.
- Cliente já `fase_cliente='vitalicio'` ou `status` ≠ 'Ativo': sai sem fazer nada
  (idempotente — re-marcar parcelas não duplica nada).
- Venda com origem qualquer (`cliente` ou não): conta na verificação do mesmo jeito.
- Operadora sem regra ativa: vira vitalício com `vitalicio_valor_estimado = null`
  (Andreia preenche depois; aparece na aba Vitalício sem conta gerada).
- Des-baixa (Recebido → Pendente no ComissoesTab): não chama nada, não reverte.

### 4. Testes (Jest, `__tests__/`)

1. `todasParcelasRecebidas`: todas Recebido → true; uma Pendente → false;
   mistura Recebido+Direto → true; lista vazia → false (sem parcela não vira).
2. `calcularVitalicioInicial`: com % da regra → valor calculado; sem % → null;
   dia do boleto presente/ausente (fallback 10).
3. Duas vendas do cliente, uma completa e outra com parcela pendente → não vira.

## Fora de escopo

- Reverter a fase automaticamente na des-baixa (manual, por decisão).
- Mexer nas comissões `tipo='vitalicio'` geradas por venda (as "2 lógicas de
  cálculo" já anotadas no modelo financeiro — esclarecer em outro momento).
- Cron/checagem diária (gatilho é só na baixa).
- Notificação/aviso visual de que o cliente virou (pode ser follow-up).
