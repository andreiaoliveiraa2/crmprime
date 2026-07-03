# Cache Policy MPA

## Objetivo

Manter memoria util sem carregar historico demais.

## Tipos de memoria

| Tipo | Arquivo | TTL | Uso |
|---|---|---|---|
| Contexto ativo | `05_WORKSPACE/current-context.md` | ate mudar projeto | Sempre no boot |
| Ledger | `07_LOGS/task-ledger.md` | permanente | Controle de tasks |
| Decisoes | `07_LOGS/decisions.md` | permanente | Premissas importantes |
| Cache operacional | `07_LOGS/context-cache.md` | 7 a 30 dias | Resumos reutilizaveis |
| Output final | `06_OUTPUTS/` | permanente | Entrega, nao contexto ativo |

## Regras de TTL

| Conteudo | TTL sugerido |
|---|---:|
| Cotacao em andamento | ate fechar ou perder |
| Lead qualificado | 7 dias (depois revisar status) |
| Proposta enviada | ate resposta ou 15 dias |
| Proposta rejeitada | 48 horas (depois mover para historico) |
| Comissao por operadora | 30 dias (ou ate mudanca de tabela) |
| Tabela de precos de operadora | 30 dias (ou ate reajuste) |
| Rede credenciada | 30 dias |
| Segurado ativo (dados de contrato) | permanente |
| Dados de carencia | ate fim do periodo |
| Script de venda aprovado | ate mudar oferta |
| Conteudo publicado | permanente |
| Rascunho rejeitado | 48 horas |
| Follow-up pendente | ate executar ou expirar |
| Calendario editorial | 30 dias |
| Proxima task | ate concluir |
| Log de tentativa sem aprendizado | descartar |

## Compactacao

Quando um arquivo de contexto passar de 120 linhas:

1. Criar resumo de ate 40 linhas.
2. Preservar decisoes, dados de lead/segurado, gaps e proxima task.
3. Mover detalhe para cache ou projeto.
4. Atualizar `current-context.md`.

## Regra de ouro

Historico so entra no prompt se ajudar a proxima decisao. Cotacao antiga nao ajuda cotacao nova se a tabela mudou.
