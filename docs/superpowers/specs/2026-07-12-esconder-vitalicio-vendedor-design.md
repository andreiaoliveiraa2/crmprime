# Esconder o vitalício do vendedor — Design

**Data:** 2026-07-12
**Pendência:** item 4 do checklist ("esconder o vitalício do vendedor em todos os lugares; valor só admin vê")

## Objetivo

O vendedor não pode ver os valores financeiros da corretora: a comissão do cliente
(`clientes.comissao`) e os valores da carteira vitalícia (`vitalicio_valor_estimado`,
`vitalicio_dia_previsto`). Ele continua vendo o resto da ficha dos clientes dele,
inclusive as Observações e a fase (Ativo/Vitalício) — só não vê nem edita valores.

## O que já está protegido (não mexer)

- **Financeiro** (`/financeiro`): redirect pra `/dashboard` se `perfil !== 'admin'`.
- **Minhas Comissões**: filtra `tipo='parcela'` e mostra só `valor_vendedor` (repasse dele).
- **Dashboard**: card "Vou receber" já é condicional por perfil (07/07).
- **RLS** de `clientes`/`vendas`/`comissoes`: vendedor só enxerga as linhas dele.

## Onde vaza hoje (escopo desta mudança)

1. **Ficha do cliente** — `src/app/(protected)/clientes/[id]/page.tsx`:
   campo "Comissão" (`fmtMoeda(c.comissao)`) aparece pra qualquer perfil.
2. **Editar cliente** — `src/app/(protected)/clientes/[id]/editar/page.tsx` +
   `src/components/ClienteFormPosVenda.tsx`: o form mostra o toggle "Fase do Cliente"
   (Ativo/Vitalício) e, quando vitalício, os campos "Valor Estimado Mensal (R$)" e
   "Dia Previsto". A página server passa o objeto `cliente` inteiro pro client
   component, então os valores viajam até o navegador mesmo se a UI esconder.

## Decisões (Andreia, 12/07)

- Esconder **só os valores** — o vendedor continua vendo que o cliente é fase
  Vitalício e continua vendo as Observações.
- **Fase do cliente**: só admin muda. Pro vendedor a fase vira um selo fixo
  (read-only), sem botão de troca.
- Abordagem **B**: esconder na UI **e** o servidor remove os campos sensíveis dos
  dados antes de mandar a página pro vendedor (o valor nunca chega no navegador).
  Sem mudança no banco (RLS por linha já existe; proteção por coluna foi descartada
  como custo alto/ganho baixo).

## Design

### 1. Ficha do cliente (`clientes/[id]/page.tsx`)

- Buscar o usuário com `getUsuarioAtual()` (mesmo helper das outras páginas).
- `const isVendedor = usuario?.perfil === 'vendedor'`.
- Se `isVendedor`: não renderizar o `<Campo label="Comissão" …>`.
- Todo o resto da ficha permanece igual (é server component, então o que não é
  renderizado não chega ao navegador).

### 2. Página de editar (`clientes/[id]/editar/page.tsx`)

- Buscar o usuário com `getUsuarioAtual()`.
- Se vendedor, **apagar do objeto antes de passar pro form**:
  `comissao`, `vitalicio_valor_estimado`, `vitalicio_dia_previsto`
  (setar `null` — o form já trata `null`).
- Passar prop nova `podeEditarVitalicio: boolean` (true = admin) pro
  `ClienteFormPosVenda`.

### 3. Formulário (`ClienteFormPosVenda.tsx`)

Prop nova `podeEditarVitalicio?: boolean` (default `true`, pra não quebrar os outros
usos do form — cliente novo, pós-venda — que hoje são fluxos onde o form já recebe
o que precisa).

Quando `podeEditarVitalicio === false`:
- **Fase do Cliente**: em vez do toggle, mostrar um selo estático com a fase atual
  ("Ativo com parcelas" ou "Vitalício").
- **Não renderizar** os campos "Valor Estimado Mensal (R$)" e "Dia Previsto".
- **No payload de save**: não incluir as chaves `fase_cliente`,
  `vitalicio_valor_estimado`, `vitalicio_dia_previsto`, `vitalicio_inicio` e
  `comissao` (montar o payload e deletar essas chaves, ou montá-lo condicionalmente).
  Assim o update preserva o que está no banco em vez de sobrescrever com null.
- A lógica `cancelarVendasParaVitalicio` (transição ativo→vitalício no save) fica
  inalcançável pro vendedor, já que `faseCliente` não muda — sem mudança nela.

### 4. Fluxo de dados

- Nenhuma migração; nenhuma mudança de RLS.
- Admin: comportamento idêntico ao atual.
- Vendedor: os três campos sensíveis chegam como `null` do servidor e a UI nem os
  mostra; o save não toca neles.

### Erros / casos de borda

- Cliente sem fase (`fase_cliente` null): selo mostra "Ativo com parcelas"
  (mesmo default do estado atual do form).
- Vendedor criando cliente NOVO: form usado com default `podeEditarVitalicio=true`
  hoje; a página `/clientes/novo` deve passar o flag também — vendedor cria cliente
  sempre como fase "ativo" (selo fixo), sem campos de vitalício.
- `getUsuarioAtual()` retornando null (sessão quebrada): tratar como vendedor
  (esconder) — o mais restritivo.

### Testes (Jest, `__tests__/`)

1. Ficha: admin vê o campo Comissão; vendedor não vê.
2. Form com `podeEditarVitalicio=false`: não renderiza toggle de fase nem campos de
   valor; mostra o selo da fase.
3. Form com `podeEditarVitalicio=false`: payload do save não contém
   `fase_cliente`/`vitalicio_*`/`comissao`.
4. Form default (admin): comportamento atual preservado (toggle + campos).

## Fora de escopo

- Transição automática venda→vitalício na parcela 4 (item 5 do checklist, outro projeto).
- Proteção por coluna no banco (opção C, descartada).
- Esconder Observações ou a fase (Andreia decidiu manter visíveis).
