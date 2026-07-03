# Comando — /o-que-temos-hoje

> O comando mais importante da MPA. A corretora abre o Claude de manhã, digita isso, e recebe o dia inteiro organizado e priorizado. É a "Central de Comando" funcionando.

## Triggers

- `/o-que-temos-hoje`
- "o que temos hoje"
- "o que tenho hoje"
- "resumo do dia"
- "bom dia mpa"
- "meu dia"
- "começar o dia"

## Quem executa

Comando MPA aciona Batman (coleta e analisa) + Capitão América (organiza em painel).

## O que faz

Varre as 6 frentes, coleta o que precisa de atenção HOJE, e entrega um painel priorizado. A corretora bate o olho e sabe exatamente o que fazer.

## Fontes de dados

| Frente | De onde vem o dado |
|---|---|
| Assistente | Gmail MCP (emails) + Google Calendar MCP (agenda) |
| Clientes | `05_WORKSPACE/clientes/` (base de segurados e leads) |
| Financeiro | `05_WORKSPACE/clientes/` + `17_RELATORIOS/` (comissões) |
| Operadoras | `14_OPERADORAS/` (apólices em análise, prazos) |
| Comercial | `05_WORKSPACE/clientes/` (leads, cotações, negociações) |
| Marketing | `02_AGENTS/conteudo.md` (sugestão do dia) |

Se os MCPs não estiverem conectados, a MPA pergunta os dados ou trabalha com o que a corretora informou na última sessão.

## Fluxo de execução

### Passo 1 — Saudação personalizada
```
Bom dia, [nome]! Hoje é [dia da semana], [data].
Vou montar seu dia. Um instante...
```

### Passo 2 — Coletar dados de cada frente

**Assistente Executiva:**
- Ler emails das últimas 24h (Gmail MCP) → filtrar urgentes
- Ler agenda do dia (Calendar MCP) → listar compromissos
- Verificar follow-ups programados que vencem hoje

**Clientes:**
- Propostas abertas aguardando retorno há mais de 2 dias
- Documentos pendentes de segurados
- Clientes sem contato há mais de 30 dias
- Onboarding: quem está em dia 7, 30 ou 90

**Financeiro:**
- Comissões previstas para entrar hoje/esta semana
- Comissões em atraso (operadora não pagou)

**Operadoras:**
- Apólices em análise há mais tempo que o normal
- Documentos pendentes que travam aprovação

**Comercial:**
- Leads novos não respondidos
- Cotações enviadas sem retorno
- Negociações em andamento

**Marketing:**
- Sugestão de post do dia (baseado no calendário editorial)

### Passo 3 — Montar o painel priorizado

```
☀️ SEU DIA — [data]

🔴 URGENTE (resolver primeiro)
• [item mais crítico — ex: lead quente sem resposta há 1 dia]
• [proposta vencendo]

📋 ASSISTENTE
• [X] emails urgentes — [resumo do mais importante]
• [X] compromissos: [horário + descrição]
• [X] follow-ups vencendo hoje

👥 CLIENTES
• [X] documentos pendentes: [nomes]
• [X] propostas aguardando retorno
• [X] clientes sem contato 30d+

💰 FINANCEIRO
• Previsto hoje: R$ [X]
• [Operadora]: R$ [X]
• ⚠️ [Operadora] em atraso: R$ [X]

🏥 OPERADORAS
• [X] apólices em análise
• [X] pendências documentais

🎯 COMERCIAL
• [X] leads novos para responder
• [X] cotações sem retorno
• [X] negociações abertas

📱 MARKETING
• Sugestão de hoje: [tema] ([formato])

---
Por onde quer começar? Posso:
1. Responder os leads urgentes
2. Fazer os follow-ups pendentes
3. Criar o post de hoje
4. Outra coisa
```

### Passo 4 — Ação imediata
A corretora escolhe e a MPA já executa — chamando o herói certo.

## Regras

1. **Priorizar sempre.** O que gera ou protege comissão vem primeiro.
2. **Ser específico.** Não dizer "você tem emails" — dizer quantos, de quem, sobre o quê.
3. **Terminar com ação.** Nunca só listar — sempre oferecer o próximo passo.
4. **Adaptar ao que existe.** Se uma frente não tem nada, não inventar — pular ou dizer "tudo em dia".
5. **Respeitar o horário.** De manhã: foco no dia. À tarde: foco no que falta. Fim de dia: resumo + amanhã.
6. **Nunca inventar dados.** Se não tem acesso, perguntar ou usar o que foi informado.

## Versão curta (quando a corretora está com pressa)

Se a corretora disser "resumo rápido" ou "só o urgente":
```
☀️ [nome], 3 coisas pra hoje:
1. 🔴 [mais urgente]
2. 🟡 [segundo mais importante]
3. 🟢 [terceiro]

Quer que eu resolva alguma agora?
```
