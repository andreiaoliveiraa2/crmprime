# Command — /compactar-contexto

## Objetivo

Reduzir custo de contexto sem perder estado operacional.

## Triggers

- `/compactar-contexto`
- "compactar contexto"
- "contexto grande demais"
- Automatico quando `current-context.md` passar de 120 linhas.

## Passos

1. Ler outputs recentes e ledger.
2. Extrair apenas decisoes, premissas, dados de lead/segurado, gaps e proxima task.
3. Atualizar `05_WORKSPACE/current-context.md` com resumo de ate 40 linhas.
4. Mover detalhes para `07_LOGS/context-cache.md` com TTL.
5. Remover do contexto ativo informacoes que nao afetam a proxima task.

## O que preservar (nunca descartar)

- Dados do lead/segurado ativo.
- Operadora em negociacao.
- Cotacao em andamento.
- Decisoes de gate.
- Premissas registradas.
- Proxima task.
- Bloqueios ativos.

## O que pode mover para cache

- Historico de conversas anteriores.
- Cotacoes antigas ja fechadas ou perdidas.
- Scripts ja aprovados e entregues.
- Detalhes de onboarding ja concluido.

## Saida

```yaml
current_context_updated: true
linhas_antes:
linhas_depois:
cache_entries_added:
discarded_context:
next_task:
```
