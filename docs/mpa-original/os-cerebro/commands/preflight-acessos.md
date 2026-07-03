# Command — /preflight-acessos

## Objetivo

Validar ambiente, pastas, acessos e limites de automacao antes de iniciar trabalho real.

## Triggers

- `/preflight-acessos`
- "verificar acessos"
- "checar portais"
- "configurar acessos"

## Passos

1. Ler `00_OS/access-preflight.md`.
2. Identificar lead/segurado/projeto alvo.
3. Verificar se existe context pack.
4. Listar acessos obrigatorios para a rota atual.
5. Verificar MCPs ativos (Gmail, Calendar, Filesystem).
6. Verificar acesso aos portais de operadoras necessarios.
7. Separar leitura, escrita, install, login, publicacao e acao destrutiva.
8. Criar checklist do que esta pronto e do que bloqueia.
9. Registrar premissas relevantes em `07_LOGS/decisions.md`.

## Checklist de verificacao

| Item | Como verificar | Bloqueante? |
|---|---|---|
| Pasta MPA | caminho acessivel | Sim |
| Gmail MCP | `claude mcp list` ou teste | Depende da task |
| Calendar MCP | `claude mcp list` ou teste | Depende da task |
| Filesystem MCP | `claude mcp list` ou teste | Depende da task |
| Portal Hapvida | login manual da corretora | Para cotacao Hapvida |
| Portal Bradesco Saude | login manual da corretora | Para cotacao Bradesco |
| Portal SulAmerica | login manual da corretora | Para cotacao SulAmerica |
| Portal Amil | login manual da corretora | Para cotacao Amil |
| Portal [operadora dental] | login manual da corretora | Para cotacao [operadora dental] |
| Portal [operadora regional] | login manual da corretora | Para cotacao [operadora regional] |
| Portal [operadora regional] | login manual da corretora | Para cotacao [operadora regional] |
| CRM | acesso configurado | Para gestao de leads |
| Tabelas de precos | arquivos atualizados | Para cotacao |
| WhatsApp | acesso ao numero comercial | Para atendimento |

## Saida

```yaml
preflight_status: pass | partial | blocked
ready_now:
missing:
needs_user_action:
blocked_by:
next_task:
```
