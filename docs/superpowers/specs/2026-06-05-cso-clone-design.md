# CSO — Corretor de Seguros Organizado: Clone do CRM A2 Prime

**Data:** 2026-06-05  
**Status:** Aprovado

## Objetivo

Criar o sistema CSO (Corretor de Seguros Organizado) como um clone do CRM A2 Prime com nova identidade visual, banco de dados separado e deploy independente. O CSO é um bônus da mentoria da Andreia para corretores de seguros com 1–5 anos de mercado.

## Escopo

### O que será feito

1. Copiar o código do CRM A2 Prime para uma nova pasta `cso-corretor`
2. Trocar toda a identidade visual (cores, logo, nome do sistema)
3. Adaptar nomes de seções conforme definido
4. Configurar variáveis de ambiente para novo banco Supabase
5. Preparar para deploy independente no EasyPanel

### O que NÃO está no escopo agora

- Upload de logo personalizada por usuário (futuro)
- Modelo multi-tenant / SaaS
- Alterações funcionais — apenas visual e nomes

## Identidade Visual

| Elemento | A2 Prime (atual) | CSO (novo) |
|---|---|---|
| Cor sidebar | `#2d1f4e` (roxo escuro) | `#7B5B3A` (marrom chocolate) |
| Fundo do app | `#f4f1ec` (off-white) | `#E8DDD0` (bege/creme) |
| Cor de destaque | `#b89a6a` (dourado) | `#2d1f4e` (roxo escuro) |
| Logo | `logo-a2prime.png` | Logo CSO (Canva, fundo transparente) |
| Nome do sistema | A2 Prime | CSO / Corretor de Seguros Organizado |

## Navegação

Mesmas seções do A2 Prime, com estas mudanças:

| Antes | Depois |
|---|---|
| Prime Academy | CSO Academy |
| "Admin · A2 Prime" (rodapé sidebar) | "Admin · CSO" |

## Arquitetura / Infraestrutura

- **Repositório:** nova pasta local `C:\Users\Andreia Ferreira\cso-corretor` (repositório git independente)
- **Banco de dados:** novo projeto Supabase (URL + chaves diferentes do A2 Prime)
- **Deploy:** novo app no EasyPanel, aponta para o repositório GitHub do CSO
- **Migrations:** as mesmas migrations do A2 Prime aplicadas no novo banco

## Variáveis de Ambiente

O `.env.local` do CSO terá:
```
NEXT_PUBLIC_SUPABASE_URL=<URL do novo projeto Supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave anon do novo projeto>
SUPABASE_SERVICE_ROLE_KEY=<chave service_role do novo projeto>
NEXT_PUBLIC_APP_URL=<URL do CSO no EasyPanel>
```

## Arquivos a modificar

- `src/app/globals.css` — variáveis de cor
- `src/components/Sidebar.tsx` — logo, cores inline, label "Prime Academy" → "CSO Academy", "A2 Prime" → "CSO"
- `src/app/layout.tsx` — título/metadata do sistema
- `public/logo-a2prime.png` → substituir pela logo CSO
- `src/app/(protected)/prime-academy/**` → renomear rota para `cso-academy`
- Referências a "A2 Prime" ou "Prime Academy" em outros arquivos

## Pendência antes de iniciar

A Andreia precisa exportar a logo do Canva com **fundo transparente** antes de trocar a logo no sistema.
