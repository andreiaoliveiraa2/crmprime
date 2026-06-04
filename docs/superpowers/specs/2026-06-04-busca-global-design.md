# Busca Global

**Data:** 2026-06-04  
**Status:** Aprovado

## Contexto

Hoje não existe forma de buscar um nome e saber se é lead ou cliente sem navegar para cada seção separadamente. A busca global permite digitar um nome, telefone ou CPF e encontrar resultados de leads e clientes num único lugar.

## Comportamento

- Ícone de lupa no Sidebar abre um modal de busca centralizado
- Modal fecha ao pressionar `Escape` ou clicar fora
- Input recebe foco automático ao abrir
- Resultados aparecem apenas com 2+ caracteres digitados
- Busca em: nome, telefone/contato, CPF (case-insensitive)
- Máximo de 5 leads + 5 clientes exibidos
- Clicar num resultado navega para a página de edição e fecha o modal
- Se nenhum resultado: mensagem "Nenhum resultado para 'X'"

## Arquitetura

### Componente `src/components/BuscaGlobal.tsx`

Componente client-side com estado local:
- `aberto: boolean` — controla visibilidade do modal
- `termo: string` — texto digitado
- `leads: { id, nome, telefone }[]` — carregados na abertura
- `clientes: { id, nome, contato, cpf }[]` — carregados na abertura

**Ao abrir o modal:** duas queries em paralelo ao Supabase:
```ts
supabase.from('leads').select('id, nome, telefone')
supabase.from('clientes').select('id, nome, contato, cpf')
```
RLS já filtra na query: vendedor só vê seus próprios registros, admin vê todos.

**Filtro local** (executado a cada keystroke):
```ts
const match = (s: string | null) =>
  (s ?? '').toLowerCase().includes(termo.toLowerCase())

const leadsMatch = leads.filter(l =>
  match(l.nome) || match(l.telefone)
).slice(0, 5)

const clientesMatch = clientes.filter(c =>
  match(c.nome) || match(c.contato) || match(c.cpf)
).slice(0, 5)
```

**Navegação ao clicar:**
- Lead → `/crm/[id]`
- Cliente → `/clientes/[id]`

### Integração no `src/components/Sidebar.tsx`

Adicionar `<BuscaGlobal />` logo acima da `<nav>` (após o bloco do logo/nome do usuário). O botão de trigger tem o mesmo estilo dos itens do menu (texto "Buscar", ícone `Search`, cor rgba branca).

## Visual do modal

```
overlay: rgba(0,0,0,0.4), fixed, inset-0, z-50
modal: bg-white, rounded-2xl, max-w-lg, w-full, mx-4, shadow-xl

─ Header:
  [Search icon] [input placeholder="Buscar leads e clientes..."]

─ Resultados (quando termo >= 2 chars):
  Seção "LEADS (N)" — label pequeno roxo
    item: nome + telefone em linha
  Seção "CLIENTES (N)" — label pequeno verde
    item: nome + contato/CPF em linha
  Hover: fundo levemente colorido, cursor pointer

─ Empty state: "Nenhum resultado para '[termo]'"
─ Antes de digitar (< 2 chars): nenhum resultado exibido
```

**Cores:**
- Label LEADS: `#2d1f4e` (roxo)
- Label CLIENTES: `#15803d` (verde)
- Hover item: `#f4f1ec`
- Input border focus: `#2d1f4e`

## Arquivos a modificar

| Arquivo | Tipo |
|---|---|
| `src/components/BuscaGlobal.tsx` | Novo |
| `src/components/Sidebar.tsx` | Adicionar `<BuscaGlobal />` |

## Fora de escopo

- Busca por operadora, tipo de plano ou outros campos
- Histórico de buscas recentes
- Atalho de teclado (Cmd+K)
- Paginação de resultados
- Busca server-side / full-text search
