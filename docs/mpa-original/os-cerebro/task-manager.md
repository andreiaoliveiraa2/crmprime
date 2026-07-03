# Task Manager do Comando MPA

## Ciclo de vida

```text
intake -> task contract -> route -> execute -> gate -> handoff -> ledger update -> next task
```

## Estados

| Estado | Significado |
|---|---|
| `backlog` | capturada, ainda nao priorizada |
| `ready` | pronta para execucao |
| `blocked` | falta dado, arquivo, acesso ou aprovacao |
| `in_progress` | sendo executada |
| `gate_review` | aguardando validacao |
| `done` | entregue e registrada |
| `rework` | voltou por falha de gate |
| `concerns` | pode avancar com nota se nao houver S3 |
| `waiting_approval` | aguardando aprovacao da corretora (proposta, envio, publicacao) |
| `waiting_operator` | aguardando retorno da operadora (cotacao, cobertura, comissao) |

## Formato minimo de task

```yaml
task_id:
status:
owner:
model_profile:
objective:
inputs:
output_contract:
acceptance_gate:
budget:
assumptions:
blocked_by:
next:
operadora:
tipo_plano:
perfil_lead:
urgencia:
```

## Politica full-auto

- Se a task cabe em ate 2 horas e nao depende de aprovacao externa, executar.
- Se a task depende de escolha mas existe default seguro, executar e registrar premissa.
- Se a task envolve cotacao com valores reais, bloquear e pedir confirmacao da fonte.
- Se a task envolve enviar proposta, bloquear e pedir aprovacao da corretora.
- Se a task envolve promessa de cobertura, bloquear e pedir confirmacao da operadora.
- Se a task exige credencial de portal, publicacao real, disparo de WhatsApp ou acao irreversivel, bloquear e pedir confirmacao.
- Se a task envolve dados sensiveis de segurado (CPF, historico medico), tratar com protocolo de seguranca.

## Ledger

O ledger vive em `07_LOGS/task-ledger.md`. O CoS atualiza:

- task id;
- status;
- rota (departamento);
- modelo profile;
- arquivo de output;
- proxima acao;
- operadora envolvida (se aplicavel);
- lead/segurado envolvido (se aplicavel).

## Rework

Se falhar no mesmo gate:

1. Primeira falha: corrigir dentro da mesma abordagem.
2. Segunda falha: trocar abordagem ou subir modelo.
3. Terceira falha: voltar etapa anterior e revisar premissas.

Se `gate-matrix.md` marcar S4, bloquear task e registrar risco antes de continuar. S4 sempre exige decisao da corretora.

## Prioridade por urgencia

| Urgencia | Significado | SLA sugerido |
|---|---|---|
| `critica` | Lead quente prestes a fechar ou cancelamento iminente | Imediato |
| `alta` | Cotacao solicitada, follow-up vencendo | Mesma sessao |
| `media` | Conteudo, relatorio, organizacao | Proximo ciclo |
| `baixa` | Melhoria, automacao, planejamento | Quando houver folga |
