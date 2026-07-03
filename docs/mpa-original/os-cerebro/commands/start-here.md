# Command — /start-here

## Objetivo

Colocar o MPA em estado operacional com o menor contexto possivel.

## Triggers

- `/start-here`
- "comecar"
- "por onde comecar"
- "o que tenho hoje"
- "resumo do dia"

## Passos

1. Ler `00_INDEX.md`.
2. Ler `00_OS/cos.md` (identidade e roteamento).
3. Ler `05_WORKSPACE/current-context.md`.
4. Ler `07_LOGS/task-ledger.md`.
5. Se `current-context.md` estiver vazio, executar onboarding rapido.
6. Se houver task `ready`, rotear pelo CoS.
7. Se trigger for "o que tenho hoje" ou "resumo do dia":
   a. Verificar emails via Gmail MCP.
   b. Verificar calendario via Calendar MCP.
   c. Verificar follow-ups pendentes no ledger.
   d. Montar resumo do dia.

## Resumo do dia

```text
Bom dia, [Nome]! Aqui o resumo do dia:

AGENDA
- [horario] [compromisso]
- [horario] [compromisso]

FOLLOW-UPS PENDENTES
- [lead] — [motivo] — [acao sugerida]
- [lead] — [motivo] — [acao sugerida]

EMAILS RELEVANTES
- [remetente] — [assunto resumido]
- [remetente] — [assunto resumido]

PRIORIDADES
1. [tarefa mais urgente]
2. [tarefa importante]
3. [tarefa de rotina]

O que quer atacar primeiro?
```

## Saida

```yaml
status:
projeto_ativo:
task_atual:
rota:
modelo_profile:
proximo_passo:
follow_ups_pendentes:
emails_relevantes:
agenda_hoje:
```
