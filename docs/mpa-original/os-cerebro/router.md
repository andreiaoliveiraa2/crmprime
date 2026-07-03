# Router MPA

## Roteamento primario

| Tipo | Entrada comum | Saida esperada | Agente |
|---|---|---|---|
| Intake | pedido cru, ideia solta | task clara + premissas | CoS |
| Prospeccao | lead novo, qualificar, abordar | perfil de lead + abordagem + follow-up | Prospeccao |
| Comercial | cotacao, proposta, comparativo, fechamento | cotacao montada + comparativo + proposta | Comercial |
| Atendimento | duvida do segurado, resposta WhatsApp/email | resposta pronta + encaminhamento | Atendimento |
| Pos-venda | cliente novo, onboarding, carencia | sequencia de boas-vindas + checklist | Pos-venda |
| Carteira | cliente sumiu, risco de cancelamento, aniversario | diagnostico + acao de retencao | Carteira |
| Indicacoes | pedir indicacao, programa de indicacoes | script + campanha de indicacao | Indicacoes |
| Operadoras | prazo, apolice, comissao, documentacao | status atualizado + pendencias | Operadoras |
| Agenda | reuniao, visita, lembrete, follow-up | evento criado + lembrete agendado | Agenda |
| Copywriter | script de venda, argumento, objecao | script pronto + variantes | Copywriter |
| Conteudo | post, ideia Instagram, educacao sobre saude | conteudo pronto + legenda + hashtags | Conteudo |
| Social Media | calendario editorial, frequencia, planejamento | calendario + cronograma de posts | Social Media |
| Relatorios | conversao, quantos clientes, dashboard | relatorio formatado + insights | Relatorios |
| Financeiro | comissao, controle financeiro, operadora pagou | extrato + pendencias + projecao | Financeiro |
| Automacoes | automatizar processo, workflow, n8n, Make | blueprint + SOP + teste + rollback | Automation Orchestrator |
| Builder | criar agente, skill, task, diretriz nova | arquivo novo + indice atualizado | Forge (`21_BUILDER_KIT/`) |
| MCP Setup | conectar Gmail/Calendar/WhatsApp/Filesystem | conector configurado + .env atualizado | CoS + `19_MCP_SETUP/` |

## Edge cases

| Caso | Decisao |
|---|---|
| Cotacao sem dados do lead | Coletar perfil minimo (nome, idade, regiao, tipo PF/PJ, vidas) antes de cotar |
| Cotacao sem regiao | Perguntar regiao — operadoras tem cobertura regional diferente |
| WhatsApp sem oferta/contexto | Context pack + rascunho com `[A PREENCHER]` |
| Lead PJ sem CNPJ | Pode avancar com perfil, mas bloquear proposta formal ate ter CNPJ |
| Lead sem faixa etaria | Bloquear cotacao — faixa muda o valor drasticamente |
| Proposta sem confirmacao de cobertura | Bloquear em GATE-PROPOSTA ate confirmar com operadora |
| Follow-up sem motivo novo | Bloquear em GATE-FOLLOW-UP — nao pressionar sem valor |
| Conteudo prometendo cobertura medica | Bloquear em GATE-CONTEUDO — risco regulatorio ANS |
| Pedido de "funil completo" de vendas | Pipeline MPA completo: lead → qualificacao → cotacao → proposta → fechamento |
| Pedido de novo agente/skill/task | Acionar Forge em `21_BUILDER_KIT/` |
| Pedido de conexao com ferramenta externa | Consultar `19_MCP_SETUP/` antes de prometer |
| Lead/segurado especifico | Ler context pack do lead, nao historico inteiro |
| Peca avulsa simples (1 script, 1 post) | Skill mental direta via agente certo, sem pipeline completo |
| Falha em gate 2 vezes | Upgrade de modelo e revisao pelo CoS |
| Falha em gate 3 vezes | Voltar etapa anterior, nao insistir na mesma abordagem |
| Operadora nao disponivel na regiao | Alertar corretora e sugerir alternativas disponiveis |
| Lead com doenca preexistente | Alertar sobre CPT (Cobertura Parcial Temporaria) e regras ANS |
| Migracao de plano (portabilidade) | Verificar carencias cumpridas e compatibilidade de cobertura |
| Demanda de plano coletivo por adesao | Verificar entidade de classe e elegibilidade |

## Uma rota por vez

O CoS pode enfileirar multiplas tasks, mas so ativa uma rota principal por vez. Paralelismo so entra quando dependencias estao claras: cotacoes de operadoras diferentes podem rodar em paralelo depois que o perfil do lead esta completo.
