# Módulo Clientes — Design

**Data:** 2026-05-19  
**Status:** Aprovado pela usuária

## Objetivo

Área completa da carteira ativa de clientes da A2 Prime Corretora de Seguros.  
Cliente = lead convertido (fechado). Não é renovação anual — cliente recorrente que pode ficar anos ativo.

## Banco de dados

Novas colunas na tabela `clientes`:

```sql
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS administradora text,
  ADD COLUMN IF NOT EXISTS numero_contrato text,
  ADD COLUMN IF NOT EXISTS data_venda date,
  ADD COLUMN IF NOT EXISTS data_implantacao date,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Ativo',
  ADD COLUMN IF NOT EXISTS vendedor text,
  ADD COLUMN IF NOT EXISTS comissao numeric;
```

## Campos por seção

**Dados Pessoais:** Nome, CPF, Data de nascimento, Telefone/WhatsApp, Email, Endereço  
**Dados do Plano:** Operadora, Administradora, Tipo de plano, Qtd. vidas, Valor, Nº contrato, Data da venda, Data de implantação, Status  
**Dados Comerciais:** Vendedor (dropdown dinâmico), Comissão, Observações

## Tela principal `/clientes`

- Busca por nome/telefone/CPF
- Filtros: Status | Operadora | Vendedor | Período
- Tabela: Nome · Status · Operadora · Tipo · Valor · Vendedor · Data Venda · Telefone · Ações
- Botão Exportar (Excel + PDF)
- Visual A2 Prime

## Ficha `/clientes/[id]`

Página somente leitura com 3 cards por seção. Botão Editar → `/clientes/[id]/editar`.

## Formulário

`/clientes/novo` e `/clientes/[id]/editar` — campos em 3 seções, grid 2 colunas, visual A2 Prime.

## Componentes

- `ClientesClient.tsx` — novo, gerencia filtros/busca/export
- `ClienteTablePosVenda.tsx` — reescrito, A2 Prime
- `ClienteExportModal.tsx` — novo, igual ao LeadExportModal
- `ClienteFormPosVenda.tsx` — reescrito, 3 seções
- Pages: `/clientes`, `/clientes/[id]`, `/clientes/[id]/editar`, `/clientes/novo`
