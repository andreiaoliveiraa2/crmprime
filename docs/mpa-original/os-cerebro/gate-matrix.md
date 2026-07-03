# Gate Matrix MPA

## Severidade

| Severidade | Significado | Acao |
|---|---|---|
| S0 | ajuste cosmetico | pode seguir |
| S1 | melhoria recomendada | pode seguir com nota |
| S2 | problema relevante | rework se for entrega final |
| S3 | bloqueio | nao avanca |
| S4 | risco alto | parar e escalar para corretora |

## Verdict

| Score | Verdict | Regra |
|---:|---|---|
| 9-10 | pass | pode avancar |
| 7-8 | concerns | avanca se nao houver S3 |
| 5-6 | rework | corrigir antes de avancar |
| 0-4 | fail | voltar etapa ou trocar abordagem |

## Bloqueios automaticos

- Cotacao com valores inventados (nao confirmados em tabela/portal).
- Promessa de cobertura sem confirmacao da operadora.
- Proposta enviada ao cliente sem aprovacao da corretora.
- WhatsApp com promessa de preco, carencia ou desconto inventado.
- Bot WhatsApp sem handoff humano.
- Disparo WhatsApp real sem confirmacao.
- Conteudo publico prometendo cobertura medica especifica.
- Conteudo publico com valores de plano (mudam por faixa/regiao).
- Follow-up sem motivo novo — pressao pura.
- Automacao com API write, CRM update, envio ou publicacao sem confirmacao.
- Automacao sem teste e rollback.
- Output final com dados de segurado inventados.
- Lead/segurado errado (context pack trocado).
- Rede credenciada mencionada que nao existe na regiao.
- Carencia informada diferente da regra da operadora.
- Falha repetida 3 vezes no mesmo gate.

## Escalada

1. S2: mesmo agente corrige.
2. S3: CoS revisa e agente especialista refaz.
3. S4: CoS bloqueia ledger e pede decisao da corretora. Nao avanca sem confirmacao humana.

## Exemplos de severidade por departamento

| Situacao | Severidade |
|---|---|
| Typo no script de WhatsApp | S0 |
| Post sem hashtags relevantes | S1 |
| Cotacao sem especificar coparticipacao | S2 |
| Proposta com valor desatualizado | S3 |
| Promessa de cobertura nao confirmada com operadora | S4 |
| Envio de proposta sem aprovacao | S4 |
| Dados de CPF expostos em output publico | S4 |
| Follow-up apos lead pedir para nao ser contatado | S4 |

## Rework log

Cada rework deve registrar:

```yaml
task_id:
gate:
issue:
severity:
fix:
attempt:
next_action:
```
