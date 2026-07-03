# Command — /whatsapp-system

## Objetivo

Criar ou revisar o sistema de WhatsApp da corretora: prospeccao, atendimento, follow-up, pos-venda e fluxos automatizados.

## Triggers

- `/whatsapp-system`
- "montar whatsapp"
- "fluxo de whatsapp"
- "sistema de whatsapp"
- "organizar whatsapp"

## Passos

1. Rodar ou consultar `00_OS/access-preflight.md`.
2. Ler `11_WHATSAPP_STACK/README.md`.
3. Ler `11_WHATSAPP_STACK/tasks/build-whatsapp-system.md`.
4. Carregar context pack da corretora.
5. Carregar `04_DIRETRIZES/whatsapp-diretrizes.md`.
6. Identificar quais fluxos a corretora precisa:

## Fluxos disponiveis

| Fluxo | Descricao | Prioridade |
|---|---|---|
| Triagem de lead novo | Primeiro contato, qualificar interesse | Alta |
| Qualificacao | Coletar dados pra cotacao (vidas, faixa etaria, regiao, tipo) | Alta |
| Follow-up pos-cotacao | Acompanhar lead apos envio de cotacao | Alta |
| Atendimento ao segurado | Responder duvidas de quem ja e cliente | Media |
| Onboarding | Boas-vindas, orientacao sobre carencias, rede credenciada | Media |
| Reativacao | Contatar leads frios ou segurados inativos | Media |
| Indicacao | Pedir indicacao a segurados satisfeitos | Media |
| Retencao | Abordar segurado com risco de cancelamento | Alta |
| Aniversario de contrato | Contato proativo no aniversario do plano | Baixa |

7. Produzir fluxos selecionados.
8. Rodar `GATE-WHATSAPP` em cada fluxo.

## Regras inegociaveis de WhatsApp

1. Bot nunca finge ser humano — se identifica como assistente.
2. Nunca promete cobertura, preco, carencia ou desconto inventado.
3. Existe handoff humano claro (quando transferir pra corretora).
4. Mensagens curtas e naturais no celular (max 3-4 linhas por mensagem).
5. Existe opcao de opt-out.
6. Fluxo nasce em modo `draft` — so ativa com aprovacao da corretora.
7. Disparo em massa exige confirmacao.

## Saida

```yaml
files:
gate_result:
open_gaps:
activation_status: draft | ready_for_review | blocked
fluxos_criados: []
fluxos_pendentes: []
next_step:
```
