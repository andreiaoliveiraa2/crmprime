# Módulo Gestão — Cadastro de Vendedores/Corretores

**Data:** 2026-05-21  
**Projeto:** CRM Seguros — A2 Prime  
**Status:** Aprovado

---

## Objetivo

Criar um módulo dedicado para cadastrar e gerir os vendedores e corretores da A2 Prime. Quando um vendedor for cadastrado aqui, aparece automaticamente nos dropdowns de vendedor em todo o sistema (CRM, Clientes, Financeiro).

---

## Decisões de Design

- **Relação com outros módulos:** campo `vendedor` em leads/clientes/vendas continua como **texto** (nome). Os dropdowns já carregam de `vendedores` filtrando `ativo = true`. Nenhuma FK necessária.
- **Excluir vendedor:** desativar (`ativo = false`) em vez de apagar — preserva histórico em leads, clientes e vendas.
- **Formulário:** página própria (não modal), igual ao padrão de `/clientes/novo`.

---

## Rotas

```
/gestao                  → tabela principal
/gestao/novo             → formulário de criação
/gestao/[id]             → ficha do vendedor
/gestao/[id]/editar      → formulário de edição
```

---

## Base de Dados

Tabela `vendedores` — expandida via migration `2026-05-21_gestao_vendedores.sql`.

### Campos

| Grupo | Campo | Tipo |
|---|---|---|
| Base | id, nome, ativo, criado_em | uuid, text, boolean, timestamptz |
| Dados pessoais | cpf_cnpj, rg, data_nascimento, sexo | text, text, date, text |
| Dados pessoais | telefone, email | text |
| Dados pessoais | endereco_cep, endereco_logradouro, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_estado | text |
| Dados profissionais | tipo | text — 'Interno' / 'Afiliado' / 'Corretor Parceiro' |
| Dados profissionais | corretora | text — 'A2 Prime' / 'A2 Corretora' / 'MEI Alessandro' |
| Dados profissionais | data_admissao, data_demissao, susep | date, date, text |
| Repasse | percentual_repasse, forma_repasse, repasse_sobre | numeric(5,2), text, text |
| Repasse | tem_vitalicio, percentual_vitalicio | boolean, numeric(5,2) |
| Bancário | banco, agencia, conta, tipo_conta, pix | text |
| Observações | observacoes | text |

### Valores permitidos (enums por texto)

- `sexo`: Masculino / Feminino / Outro
- `tipo`: Interno / Afiliado / Corretor Parceiro
- `corretora`: A2 Prime / A2 Corretora / MEI Alessandro
- `forma_repasse`: No recebimento / Antecipado
- `repasse_sobre`: Comissão Recebida / Comissão Prevista / Prêmio Líquido / Valor Fixo / Repasse por Vida
- `tipo_conta`: Corrente / Poupança

---

## Componentes

### `GestaoClient.tsx`
- Tabela com colunas: Nome, Tipo, Corretora, Status, Telefone, Ações
- Filtros client-side: por tipo, por corretora, por status
- Busca por nome ou CPF
- Badge colorido: Ativo (verde `#22c55e`) / Inativo (vermelho `#ef4444`)
- Botões: Ver (`/gestao/[id]`), Editar (`/gestao/[id]/editar`), Desativar (com confirmação)
- Botão "+ Novo Vendedor" → `/gestao/novo`

### `VendedorForm.tsx`
- Formulário em 5 secções (accordion ou tabs):
  1. Dados Pessoais
  2. Dados Profissionais
  3. Configuração de Repasse
  4. Informações Bancárias
  5. Observações
- Usado em `/gestao/novo` e `/gestao/[id]/editar`
- Validação: `nome` obrigatório; restantes opcionais

### `FichaVendedor.tsx`
- Cards com todos os dados organizados por secção
- Histórico de produção: tabela de `vendas` onde `vendedor = nome`
- Totais calculados: produção do mês atual, produção total, comissões pagas, comissões pendentes
- Botão "Editar" no topo → `/gestao/[id]/editar`

---

## Visual

Seguir padrão do sistema:
- Fundo: `#f4f1ec`
- Cards: branco
- Cor primária: `#2d1f4e` (roxo)
- Cor secundária: `#b89a6a` (dourado)
- Responsivo para mobile

---

## Menu

Adicionar item "Gestão" no Sidebar entre Financeiro e Configurações.

---

## Ficheiros a Criar

```
src/app/(protected)/gestao/page.tsx
src/app/(protected)/gestao/novo/page.tsx
src/app/(protected)/gestao/[id]/page.tsx
src/app/(protected)/gestao/[id]/editar/page.tsx
src/components/GestaoClient.tsx
src/components/VendedorForm.tsx
src/components/FichaVendedor.tsx
```

## Ficheiros a Editar

```
src/components/Sidebar.tsx  (ou equivalente — adicionar item Gestão)
src/lib/types.ts            (expandir interface Vendedor com novos campos)
```

---

## Fora de Âmbito

- Migração de dados históricos (leads/clientes/vendas existentes não são alterados)
- FK constraints entre vendedor e outros módulos
- Permissões por role / multi-utilizador
- Relatórios avançados de comissões (módulo Financeiro existente trata isso)
