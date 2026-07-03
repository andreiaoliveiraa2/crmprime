# Handoffs MPA

## Contrato padrao

Todo handoff deve responder:

```yaml
from:
to:
task_id:
output:
used_inputs:
assumptions:
open_gaps:
gate_result:
next_step:
files:
```

## Handoffs criticos

| De | Para | Nao pode faltar |
|---|---|---|
| Prospeccao | Comercial | perfil do lead, numero de vidas, urgencia, objecoes levantadas, canal de origem |
| Comercial | Operadoras | dados da cotacao, operadoras possiveis, tipo de plano, faixa etaria, regiao, coparticipacao |
| Operadoras | Comercial | valores confirmados, coberturas reais, carencias, rede credenciada na regiao, vigencia |
| Comercial | Pos-venda | dados do segurado, numero da apolice, operadora, data de inicio, coberturas contratadas, carencias |
| Pos-venda | Carteira | segurado ativado, datas de aniversario de contrato, operadora, tipo de plano, historico de onboarding |
| Carteira | Indicacoes | segurados satisfeitos identificados, tempo de contrato, NPS ou satisfacao informal, abertura para indicar |
| Carteira | Comercial | lead de upsell/cross-sell (segurado que quer mudar plano, adicionar vidas ou cobertura) |
| Atendimento | Operadoras | duvida que exige consulta a operadora (cobertura, autorizacao, rede credenciada) |
| Atendimento | Comercial | lead identificado durante atendimento (segurado quer adicionar dependente, mudar plano) |
| Copywriter | Conteudo | scripts aprovados que podem virar posts educativos |
| Conteudo | Social Media | posts prontos para agendar no calendario editorial |
| Social Media | Relatorios | metricas de engajamento e leads gerados por conteudo |
| Financeiro | Operadoras | comissoes pendentes ou divergentes que precisam de cobranca |
| Agenda | todos | lembretes de follow-up, reunioes agendadas, prazos de operadora |

## Handoffs de retorno

| De | Para | Quando |
|---|---|---|
| Comercial | Prospeccao | lead nao qualificado — precisa mais informacao antes de cotar |
| Operadoras | Comercial | cotacao indisponivel na regiao — precisa trocar operadora |
| Pos-venda | Atendimento | segurado com duvida recorrente que nao e de onboarding |
| Carteira | Atendimento | segurado com reclamacao que precisa de atencao imediata |

## Regra

Handoff bom reduz contexto futuro. Handoff ruim faz o proximo agente reler tudo.

Num handoff entre departamentos da corretora, o mais importante e: dados do lead/segurado, status atual, o que ja foi feito e o que falta.
