# Command — /nova-task

## Objetivo

Transformar um pedido novo em task pronta para execucao.

## Triggers

- `/nova-task`
- "nova tarefa"
- "criar task"
- "preciso de..."

## Passos

1. Classificar pedido no `00_OS/router.md`.
2. Criar task usando `03_TASKS/task-contract.md`.
3. Definir owner (departamento responsavel).
4. Definir `model_profile` pelo `00_OS/model-router.yaml`.
5. Definir gate aplicavel.
6. Preencher campos especificos: operadora, tipo_plano, perfil_lead, urgencia.
7. Registrar em `07_LOGS/task-ledger.md`.
8. Registrar premissa em `07_LOGS/decisions.md` se houver escolha relevante.

## Campos obrigatorios

```yaml
task_id:
owner:
model_profile:
gate:
status: ready
objetivo:
output_esperado:
operadora:
tipo_plano:
perfil_lead:
urgencia: critica | alta | media | baixa
```

## Regras

- Se o pedido envolve lead real, exigir perfil minimo antes de marcar como `ready`.
- Se o pedido envolve cotacao, exigir regiao + faixa etaria + tipo (PF/PJ) antes de marcar como `ready`.
- Se falta dado critico, marcar como `blocked` com `blocked_by` claro.
- Se o pedido e generico ("faz um script"), pedir contexto minimo antes de criar task.

## Saida

```yaml
task_id:
owner:
model_profile:
gate:
status: ready | blocked
blocked_by:
operadora:
tipo_plano:
perfil_lead:
urgencia:
```
