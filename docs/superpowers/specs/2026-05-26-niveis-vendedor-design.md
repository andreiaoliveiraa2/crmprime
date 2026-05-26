# Gerenciamento de Níveis de Vendedor

**Data:** 2026-05-26  
**Status:** Aprovado

## Objetivo

Permitir que a Andreia gerencie os níveis de vendedor (Iniciante, Experiente, VIP) pela interface, sem precisar de alterações no código. A tela fica em Configurações, com o mesmo layout das seções de CNPJs de Recebimento e Categorias de Despesa.

---

## Banco de Dados

Nova tabela `niveis_vendedor`:

```sql
create table niveis_vendedor (
  id   uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true
);
```

Migration insere os 3 níveis atuais como dados iniciais:
- Iniciante
- Experiente
- VIP

---

## Componente `NiveisVendedorSection`

Mesmo layout de `CategoriasDespesaSection`:

- Lista cada nível com nome + badge Ativo/Inativo + botão lápis
- Botão "+ Novo Nível" no cabeçalho
- Modal para criar/editar com campo Nome e toggle Ativo/Inativo
- Sem botão de exclusão (igual às outras seções) — desativar é suficiente
- `router.refresh()` após salvar

Nenhuma propriedade além de `nome` e `ativo` — os percentuais por nível ficam em cada Operadora.

---

## Configurações (`configuracoes/page.tsx`)

- Busca `niveis_vendedor` com `.order('nome')`
- Renderiza `<NiveisVendedorSection niveis={niveis} />` após CategoriasDespesaSection

---

## Propagação nos componentes existentes

Os componentes abaixo recebem `niveis: NivelVendedor[]` como prop (buscado no server component pai) e usam os nomes dinamicamente, substituindo `NIVEIS_VENDEDOR`:

| Componente | Pai que busca e passa |
|---|---|
| `VendedorForm.tsx` | `gestao/[id]/page.tsx` e `gestao/novo/page.tsx` |
| `GestaoClient.tsx` | `gestao/page.tsx` |
| `OperadoraForm.tsx` | `gestao/operadoras/[id]/page.tsx` e `gestao/operadoras/nova/page.tsx` |

`NIVEIS_VENDEDOR` em `types.ts` pode ser removido após a migração.

---

## Tipo TypeScript

```ts
export interface NivelVendedor {
  id: string
  nome: string
  ativo: boolean
}
```

---

## Arquivos alterados

1. `supabase/migrations/<timestamp>_niveis_vendedor.sql` — nova tabela + dados iniciais
2. `src/lib/types.ts` — adiciona `NivelVendedor`, remove `NIVEIS_VENDEDOR`
3. `src/components/NiveisVendedorSection.tsx` — novo componente
4. `src/app/(protected)/configuracoes/page.tsx` — query + renderização
5. `src/app/(protected)/gestao/page.tsx` — busca niveis, passa para GestaoClient
6. `src/app/(protected)/gestao/[id]/page.tsx` — busca niveis, passa para VendedorForm
7. `src/app/(protected)/gestao/novo/page.tsx` — busca niveis, passa para VendedorForm
8. `src/app/(protected)/gestao/operadoras/[id]/page.tsx` — busca niveis, passa para OperadoraForm
9. `src/app/(protected)/gestao/operadoras/nova/page.tsx` — busca niveis, passa para OperadoraForm
10. `src/components/GestaoClient.tsx` — recebe niveis como prop
11. `src/components/VendedorForm.tsx` — recebe niveis como prop
12. `src/components/OperadoraForm.tsx` — recebe niveis como prop, campos de repasse dinâmicos
