# Access Preflight MPA

## Objetivo

Pedir e validar acessos no inicio para evitar travar a execucao a cada etapa. A corretora nao deve precisar entender terminal, PATH, bash, token, pasta ou permissao tecnica.

## Principio

Full-auto depende de preflight. O CoS deve pedir o pacote de acessos uma vez, organizar o que falta e seguir sem interromper quando a acao for reversivel.

## O que validar no inicio

| Area | O que pedir | Uso |
|---|---|---|
| Pasta do MPA | caminho local do MPA | leitura/escrita de outputs, logs e workspace |
| Email (Gmail) | acesso via MCP Gmail | ler emails de leads, operadoras e segurados |
| Calendario | acesso via MCP Calendar | agendar reunioes, follow-ups e lembretes |
| WhatsApp | acesso via MCP ou WhatsApp Web | atender leads, follow-up, suporte ao segurado |
| Filesystem | acesso via MCP Filesystem | organizar propostas, apolices e documentos |
| Portais de operadoras | login nos portais (Hapvida, Bradesco, SulAmerica, Amil, etc) | cotacao, status de proposta, comissao |
| CRM | acesso ou export de campos | leads, pipeline, follow-up |
| Tabelas de precos | arquivos locais ou acesso a portal | cotacao de planos |
| Rede credenciada | acesso a consulta por operadora | informar lead sobre hospitais/clinicas |
| Provas sociais | depoimentos, cases, prints permitidos | conteudo e argumentacao |
| Regras comerciais | comissoes, descontos, campanhas vigentes | evitar prometer o que nao existe |

## Classificacao de permissao

| Tipo | Pode full-auto? | Regra |
|---|---|---|
| leitura local | sim | se estiver dentro do workspace permitido |
| escrita em outputs/workspace/logs | sim | registrar arquivos criados |
| install/tooling | pedir no inicio | depende do ambiente e pode alterar maquina |
| login/OAuth (Gmail, Calendar) | pedir no inicio | usuario faz login, agente valida |
| login em portal de operadora | pedir no inicio | credencial da corretora, nao do agente |
| cotacao em portal real | nao | confirmar dados antes de submeter |
| envio de proposta real | nao | confirmar antes de enviar ao lead |
| disparo WhatsApp real | nao | confirmar antes de enviar em massa ou ativar |
| publicacao de conteudo | nao | confirmar antes de publicar |
| alteracao em CRM | nao | confirmar antes de atualizar status de lead |
| segredo/token | nunca pedir no chat | usar `.env` local, OAuth ou variavel de ambiente |

## Pacote minimo para comecar

```yaml
corretora:
objetivo:
pasta_mpa:
email_acesso:
calendario_acesso:
whatsapp_acesso:
operadoras_portais:
  hapvida:
  bradesco_saude:
  sulamerica:
  amil:
  dental_center:
  previmed:
  maxmed:
crm:
tabelas_precos:
rede_credenciada:
responsavel_humano:
limites_de_automacao:
```

Se faltar algo, o CoS deve criar task com status `blocked` apenas para o item que realmente impede execucao. O restante avanca com `[A PREENCHER]`.

## Saida do preflight

```yaml
preflight_status: pass | partial | blocked
ready_now:
missing:
risky_actions_need_confirmation:
safe_defaults:
next_task:
```
