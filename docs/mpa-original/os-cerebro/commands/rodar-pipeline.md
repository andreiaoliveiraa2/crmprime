# Command — /rodar-pipeline

## Objetivo

Executar o pipeline MPA completo quando a demanda exigir varias fases (lead → qualificacao → cotacao → proposta → fechamento → apolice → onboarding).

## Triggers

- `/rodar-pipeline`
- "pipeline completo"
- "funil completo"
- "processo de venda completo"

## Passos

1. Confirmar que a demanda e pipeline, nao peca avulsa.
2. Ler `01_PIPELINE/mpa-pipeline.yaml`.
3. Criar tasks P0 a P7 no ledger, mas marcar como `blocked` as que dependem de gate anterior.
4. Executar P0 (intake) e P1 (qualificacao).
5. Avancar fase por fase conforme gates passam.
6. So liberar P3 (proposta) quando `GATE-COTACAO` passar.
7. So liberar P4 (envio de proposta) quando corretora aprovar.

## Fases do pipeline

| Fase | Descricao | Gate |
|---|---|---|
| P0 | Intake — capturar lead | GATE-INTAKE |
| P1 | Qualificacao — perfil, vidas, regiao, urgencia | GATE-INTAKE |
| P2 | Cotacao — montar comparativo com operadoras | GATE-COTACAO |
| P3 | Proposta — gerar proposta formal | GATE-PROPOSTA |
| P4 | Envio — enviar ao lead (REQUER APROVACAO) | GATE-DELIVERY |
| P5 | Fechamento — acompanhar decisao, objecoes | GATE-FOLLOW-UP |
| P6 | Apolice — gerar documentacao, registrar na operadora | GATE-DELIVERY |
| P7 | Onboarding — boas-vindas, carencias, rede credenciada | GATE-DELIVERY |

## Regras

- Se uma fase falhar 3 vezes, parar e voltar a fase anterior. Nao insistir em output caro com base ruim.
- P4 (envio de proposta) NUNCA roda sem aprovacao da corretora.
- P6 (apolice) exige confirmacao da operadora.
- Cotacoes em paralelo (varias operadoras) so rodam depois que P1 esta completo.
- Se lead desistir em qualquer fase, registrar motivo e mover para `lost`.

## Saida

```yaml
pipeline_status: in_progress | complete | blocked | lost
fase_atual:
gates_passados: []
gates_pendentes: []
blocked_by:
next_action:
```
