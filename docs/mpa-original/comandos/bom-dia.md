# Comando — /bom-dia

> O coração visual da MPA. Todo dia a corretora abre e vê a vida inteira num dashboard bonito: prioridades, emails, radar de conteúdo, agenda, comissões, carteira, pendências, contas a pagar e o conteúdo do dia (2 perfis). É o "sonho das 7h" — abrir e ter tudo na frente, de forma visual.

## Triggers

- `/bom-dia`
- "bom dia"
- "meu dia"
- "abrir o dia"
- "painel do dia"
- "dashboard"
- "o que temos hoje" (versão visual)

## Quem executa

Comando MPA → Batman (coleta tudo) → Capitão América (organiza e prioriza) → Flash (monta o painel visual)

## Entrega DUPLA

1. **Painel visual (HTML)** — o dashboard bonito que abre no navegador. É o principal (a corretora é visual).
2. **Resumo curto no chat** — versão rápida em texto, para ler na hora.

## Os blocos do dashboard

| Bloco | Fonte do dado |
|-------|---------------|
| 🔥 **Resolva primeiro** | As 3 prioridades (cruza tudo: comissão + urgência + vencimentos) |
| 💰 **Vou receber** | `financeiro-comissoes.md` (por operadora + atraso) |
| 📧 **Emails** | Gmail MCP (ou a corretora cola) |
| 📡 **Radar do dia** | Squad de Inteligência (tema em alta) |
| 📅 **Agenda** | Calendar MCP + base de segurados (aniversários de apólice) |
| 🎯 **Carteira** | `base-segurados.md` (donut: vitalício/inicial/análise/risco) |
| ⚠️ **Pendências de ontem** | `funil-comercial.md` + cadastros com pendência |
| 💳 **Pagar** | `05_WORKSPACE/contas-a-pagar.md` |
| ✨ **Posts de hoje** | 2 perfis (empresa + pessoal) do calendário de conteúdo |
| 🟡 **Stories de hoje** | 2 perfis, da rotina de stories |
| 📅 **Semana de conteúdo** | Os 5 dias variados (carrossel/post/reels/stories) |

## Como gerar o painel

1. **Coletar os dados** de cada bloco (das fontes acima). Se um MCP não estiver conectado, usar o que a corretora informou/colou ou os dados das bases.
2. **Identificar as 3 prioridades** do dia: o que gera ou protege comissão + o que vence hoje + lead quente esfriando.
3. **Gerar o HTML** do dashboard usando como base o layout de `exemplos/bom-dia-painel.html` (dashboard escuro premium, identidade roxo #a855f7 + dourado #d4a843, sidebar, donut da carteira, barras de comissão com valores à direita).
4. **Aplicar a identidade visual** da corretora (cores da marca, se diferentes).
5. **Preencher com os dados reais** coletados no passo 1.
6. **Salvar** em `06_OUTPUTS/bom-dia-[data].html` e abrir no navegador.
7. **Entregar também o resumo curto** no chat.

## Resumo curto no chat (versão rápida)

```
☀️ Bom dia, [nome]! [dia], [data]

🔥 RESOLVA PRIMEIRO
1. [prioridade 1]
2. [prioridade 2]
3. [prioridade 3]

📧 [X] emails urgentes · 📅 [X] compromissos · 💰 R$ [X] a receber
⚠️ [X] pendências · 💳 [X] contas vencendo

📡 Radar: [tema em alta] — quer um post sobre?
✨ Hoje: [post empresa] + [post pessoal] · [X] stories

Abri seu painel completo no navegador. Por onde começamos?
```

## Os 2 perfis (empresa + pessoal)

Muitos corretores (concessionárias) têm perfil da empresa E pessoal. O bloco de conteúdo
sempre mostra os dois separados, cada um com formato e horário. Ver `minha-marca/perfis-instagram.md`.

## De onde vêm os dados

| Tem conexão | Como funciona |
|-------------|---------------|
| Gmail + Calendar conectados | Puxa emails e agenda automaticamente |
| Notion conectado (opção) | Puxa clientes/comissões do CSO |
| Bases preenchidas | Mostra comissões, leads, carteira reais |
| Sem conexão | A corretora cola/informa, a MPA monta com o que tiver |

## Versão automática das 7h

Para o painel aparecer sozinho todo dia às 7h, configurar tarefa agendada. Requer Gmail/Calendar
conectados para ser 100% automático. Sem isso, a corretora digita "bom dia" ao abrir o computador.
A corretora pode pedir: "agenda meu bom dia pras 7h todo dia".

## Regras

1. **Priorizar sempre** — o topo do painel é o que mais importa (comissão + urgência).
2. **Visual e limpo** — a corretora é visual; o painel tem que ser bonito e escaneável.
3. **Identidade da marca** — usar as cores da corretora.
4. **Terminar com ação** — o resumo sempre leva a um próximo passo.
5. **Nunca inventar dados** — se não tem, mostrar vazio ou perguntar.
6. **Valores sempre visíveis** — nas barras de comissão, valor à direita (não dentro da barra).
7. **Atualizar ao longo do dia** — pode rodar de novo à tarde para ver o que falta.

## Conexão com outros comandos

- "abre o post de hoje" → mostra a arte + legenda do dia
- "resolve o lead do João" → vai pro follow-up
- "cria o post da semana" → vai pro agendar-semana
