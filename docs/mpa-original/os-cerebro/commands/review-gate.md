# Command — /review-gate

## Objetivo

Validar uma entrega contra o gate correto.

## Triggers

- `/review-gate`
- "revisar gate"
- "validar entrega"
- "passou no gate?"

## Passos

1. Identificar tipo de entrega (cotacao, proposta, script, conteudo, follow-up, etc).
2. Escolher gate em `00_OS/gates.md`.
3. Se gate for bloqueante (GATE-COTACAO, GATE-PROPOSTA, GATE-CONTEUDO), usar `reviewer-frontier`.
4. Aplicar matriz em `00_OS/gate-matrix.md`.
5. Devolver verdict, score, issues e fixes.
6. Atualizar ledger para `done`, `concerns` ou `rework`.

## Gates disponiveis

| Entrega | Gate |
|---|---|
| Task nova, pedido classificado | GATE-INTAKE |
| Cotacao de plano | GATE-COTACAO |
| Proposta para lead | GATE-PROPOSTA |
| Post, conteudo, legenda | GATE-CONTEUDO |
| Mensagem de follow-up | GATE-FOLLOW-UP |
| Fluxo WhatsApp, bot, script | GATE-WHATSAPP |
| Automacao, workflow, SOP | GATE-AUTOMATION |
| Entrega final ao corretora | GATE-DELIVERY |

## Bloqueios automaticos (S4)

- Cotacao com valor inventado.
- Proposta com cobertura nao confirmada.
- Conteudo prometendo cobertura especifica.
- WhatsApp com preco/carencia inventado.
- Envio sem aprovacao da corretora.

## Saida

```yaml
verdict: pass | concerns | rework | fail
score: 0-10
severity: S0 | S1 | S2 | S3 | S4
blocked_next_step: true | false
specific_issues:
concrete_fixes:
next_status: done | concerns | rework
```
