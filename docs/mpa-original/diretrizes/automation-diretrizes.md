# Automacao — Diretrizes para Corretora de Saude

> Principios e limites para qualquer automacao na operacao da corretora. Automacao e alavanca, nao substituicao — o julgamento da corretora permanece soberano em decisoes que envolvem leads reais, valores e coberturas.

---

## Principio central

Automacao na corretora serve para eliminar trabalho repetitivo que nao exige julgamento humano. Tudo que envolve promessa de cobertura, valor de plano, dado sensivel de segurado ou envio ao cliente exige confirmacao da corretora antes de executar.

Automacao boa e invisivel pro lead e libertadora pra corretora. Automacao ruim e quando o lead percebe que esta falando com robo mal configurado ou quando a corretora perde controle do que esta sendo enviado em nome dela.

---

## Hierarquia de automacao

### Nivel 1 — Leitura automatica (sem restricao)

Acoes que apenas leem e organizam informacao. Nao alteram nada, nao enviam nada, nao expoe nada.

| Acao | Exemplo |
|---|---|
| Ler emails | Classificar inbox, identificar leads novos, priorizar por urgencia |
| Ler agenda | Verificar compromissos, renovacoes proximas, lembretes |
| Ler mensagens WhatsApp | Identificar leads que responderam, leads frios, perguntas pendentes |
| Ler arquivos | Acessar templates, tabelas de operadoras, historico de cliente |
| Classificar lead | Rotular como quente/morno/frio com base em sinais da conversa |
| Gerar rascunho interno | Criar texto que a corretora vai revisar antes de enviar |

### Nivel 2 — Escrita assistida (exige revisao)

Acoes que produzem conteudo ou artefato que sera usado em contato com lead/segurado. A corretora revisa antes de qualquer envio.

| Acao | Exemplo |
|---|---|
| Rascunhar email | Resposta a lead, follow-up, proposta |
| Rascunhar WhatsApp | Mensagem de qualificacao, follow-up, pos-venda |
| Montar comparativo | Comparar planos de operadoras com dados da tabela |
| Gerar conteudo | Post, carrossel, stories, reels |
| Criar proposta | Documento de proposta formal |
| Preparar relatorio | Resumo de carteira, comissoes, conversao |

### Nivel 3 — Acao automatica (exige confirmacao explicita)

Acoes que enviam algo para o mundo externo ou alteram dados de forma irreversivel.

| Acao | Gatilho de confirmacao |
|---|---|
| Enviar email | "Posso enviar este email para [lead]?" |
| Enviar WhatsApp | "Posso enviar esta mensagem para [lead]?" |
| Disparar em massa | "Voce confirma o envio para [N] contatos?" |
| Publicar conteudo | "Posso publicar este post?" |
| Atualizar CRM | "Posso mover [lead] para [status]?" |
| Agendar compromisso | "Posso agendar [evento] para [data]?" |
| Acessar portal de operadora | "Posso acessar o portal da [operadora]?" |

### Nivel 4 — Bloqueado (nunca automatizar)

Acoes que nunca devem ser automatizadas, independente do nivel de confianca.

| Acao | Motivo |
|---|---|
| Prometer cobertura | Risco regulatorio ANS — so a operadora confirma |
| Citar valores sem fonte | Risco de propaganda enganosa |
| Enviar proposta sem revisao | Erro pode custar comissao e reputacao |
| Compartilhar dados de segurado | LGPD + sigilo medico |
| Assinar contrato | Ato juridico — exige vontade humana |
| Orientar sobre doenca preexistente | Exercicio ilegal da medicina |
| Negociar comissao com operadora | Estrategia comercial — decisao da corretora |
| Cancelar plano de segurado | Irreversivel — exige confirmacao do segurado + corretora |

---

## Anatomia de uma automacao

Toda automacao na corretora deve ser documentada com:

```yaml
automacao:
  nome:
  objetivo:
  trigger: "O que dispara a automacao"
  tipo: "leitura | assistida | automatica"
  entradas:
    - dado_1
    - dado_2
  saidas:
    - artefato_1
    - artefato_2
  ferramentas:
    - gmail_mcp
    - whatsapp_mcp
    - filesystem
  responsavel: "Quem aprova e monitora"
  handoff_humano: "Quando a corretora assume"
  rollback: "Como desfazer se der errado"
  riscos:
    - risco_1: mitigacao_1
  status: "draft | ativa | pausada | desativada"
  gate: GATE-AUTOMATION
```

---

## Fluxos automatizaveis na corretora

### Alta prioridade

| Fluxo | Nivel | Descricao |
|---|---|---|
| Triagem de inbox | Leitura | Classificar emails por tipo: lead, operadora, administrativo, spam |
| Resumo do dia | Leitura | Compilar agenda + emails + follow-ups pendentes |
| Alerta de renovacao | Leitura | Avisar quando contrato de segurado esta a 60 dias de vencer |
| Rascunho de follow-up | Assistida | Gerar mensagem de follow-up com contexto do lead |
| Classificacao de lead | Leitura | Rotular lead como quente/morno/frio com base em interacoes |

### Media prioridade

| Fluxo | Nivel | Descricao |
|---|---|---|
| Onboarding automatico | Assistida | Gerar sequencia de boas-vindas para segurado novo |
| Comparativo de planos | Assistida | Montar tabela comparativa com dados de tabela vigente |
| Follow-up pos-cotacao | Assistida | Gerar mensagens de acompanhamento apos envio de cotacao |
| Calendario editorial | Assistida | Sugerir temas e datas para conteudo da semana |
| Relatorio semanal | Leitura | Compilar metricas da semana (leads, cotacoes, fechamentos) |

### Baixa prioridade (avancado)

| Fluxo | Nivel | Descricao |
|---|---|---|
| Reativacao de leads frios | Assistida | Gerar mensagens para leads inativos ha 30+ dias |
| Monitoramento de portais | Leitura | Verificar atualizacoes em portais de operadoras |
| Controle de comissoes | Leitura | Cruzar apolices ativas com pagamentos recebidos |
| Pipeline de conteudo | Assistida | Produzir lote de posts para a semana |

---

## Regras de automacao para corretora

### 1. Draft antes de live

Toda automacao nasce em modo `draft`. So ativa apos:

- Corretora revisar e aprovar
- Teste com dados ficticios ou lead de teste
- Gate de automacao passar

### 2. Handoff humano obrigatorio

Toda automacao que interage com lead/segurado deve ter ponto de handoff humano claro:

- Lead quer comprar -> transferir para corretora
- Lead reclama -> transferir para corretora
- Dado sensivel (CPF, historico medico) -> corretora assume
- Duvida sobre cobertura especifica -> corretora responde
- Negociacao de preco -> corretora decide
- Questao regulatoria ou legal -> corretora avalia

### 3. Fail safe

Se a automacao falhar:

- Nenhuma mensagem e enviada
- Nenhum dado e alterado
- Log registra o que aconteceu
- Corretora e notificada
- Nao tenta novamente automaticamente (a menos que seja leitura)

### 4. Monitoramento

- Revisar automacoes ativas todo primeiro dia util do mes
- Verificar se triggers ainda fazem sentido
- Verificar se templates estao atualizados (tabelas, scripts, valores)
- Desativar automacoes que nao estao gerando resultado

### 5. Isolamento

- Automacao de prospeccao nao acessa dados de segurado ativo
- Automacao de pos-venda nao acessa pipeline comercial
- Cada automacao tem escopo minimo — acessa apenas o que precisa

---

## Ferramentas de automacao

### Nativas (ja disponiveis no MPA)

| Ferramenta | Para que serve |
|---|---|
| Gmail MCP | Ler, classificar, rascunhar emails |
| Google Calendar MCP | Ler agenda, criar lembretes |
| WhatsApp MCP | Ler mensagens, classificar leads |
| Filesystem MCP | Acessar templates, salvar outputs |
| Google Drive MCP | Acessar propostas, tabelas |
| Playwright MCP | Acessar portais de operadoras |

### Externas (integracao futura)

| Ferramenta | Para que serve |
|---|---|
| n8n / Make | Workflows visuais para conectar ferramentas |
| Pipedrive / CRM | Gestao de pipeline de leads |
| Notion / Trello | Organizacao de tarefas e projetos |
| Zapier | Conectar apps sem codigo |
| Google Sheets | Planilhas de controle (comissoes, carteira) |

---

## Anti-patterns de automacao

| Anti-pattern | Por que e ruim | O que fazer |
|---|---|---|
| Automatizar tudo de uma vez | Perde controle, nao sabe o que quebrou | Automatizar um fluxo por vez, validar, avancar |
| Bot fingindo ser humano | Lead descobre e perde confianca | Bot se identifica como assistente |
| Disparo em massa sem segmentacao | Leads recebem mensagem irrelevante, bloqueiam | Segmentar por perfil, personalizar |
| Automacao sem rollback | Se der errado, nao tem como desfazer | Definir rollback antes de ativar |
| Automacao sem monitoramento | Roda meses sem ninguem verificar | Revisao mensal obrigatoria |
| Valores hardcoded | Tabela muda, automacao continua com preco antigo | Valores sempre vindos de fonte atualizada |
| Skip de gate | "Vou ativar logo, nao precisa de teste" | Gate e obrigatorio, sem excecao |

---

## Teste de automacao

Antes de ativar qualquer automacao, verificar:

- [ ] Trigger funciona corretamente (dispara quando deveria, nao dispara quando nao deveria)
- [ ] Dados de entrada estao corretos e completos
- [ ] Saida e formatada corretamente para o canal (WhatsApp, email, arquivo)
- [ ] Handoff humano funciona (a corretora recebe o alerta)
- [ ] Fail safe funciona (se falhar, nada e enviado)
- [ ] Rollback funciona (se precisar desfazer, consegue)
- [ ] Dados sensiveis nao sao expostos
- [ ] Lead/segurado nao recebe mensagem duplicada
- [ ] Tom de voz esta adequado (nao parece robo)
- [ ] Claims nao foram inventados (valores, coberturas, carencias)

---

## Metricas de automacao

| Metrica | O que medir | Meta |
|---|---|---|
| Tempo economizado | Horas/semana que a corretora nao precisa fazer manualmente | >5h/semana |
| Taxa de erro | Automacoes que falharam / total de execucoes | <2% |
| Handoff rate | Vezes que handoff humano foi acionado / total de interacoes | 10-30% (muito baixo = bot respondendo onde nao deveria) |
| Satisfacao do lead | Lead continua engajado apos interacao automatizada | Nao medir diretamente — medir pela taxa de resposta |
| Automacoes ativas | Total de automacoes rodando vs. planejadas | Crescer gradualmente |
