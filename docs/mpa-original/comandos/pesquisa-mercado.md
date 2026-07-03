# Comando — /pesquisa-mercado

> Inteligência de mercado antes de criar conteúdo. A MPA analisa o que outras corretoras e perfis de saúde estão postando, identifica o que está em alta, e usa isso para criar conteúdo que já nasce com chance de performar. Para de adivinhar — passa a postar com base em dados.

## Triggers

- `/pesquisa-mercado`
- "pesquisa de mercado"
- "o que está em alta"
- "analisar concorrência"
- "benchmarking"
- "o que os outros estão postando"

## Quem executa

Comando MPA → Batman (pesquisa e analisa) → Capitão América (organiza os achados) → Mulher Maravilha (transforma em ideias de conteúdo)

## Pré-requisito

Para a pesquisa funcionar de verdade, precisa de uma forma de acessar o Instagram:
- **Composio MCP** (acessa Instagram via API) — melhor opção
- **Playwright MCP** (navega no Instagram pelo navegador)
- **Modo manual:** a corretora cola os perfis/posts e a MPA analisa

## Como usar

### Passo 1 — Definir o que pesquisar
```
[nome], vou fazer sua pesquisa de mercado. Me ajuda a focar:

Quais perfis você quer que eu analise? Pode ser:
1. Concorrentes diretos (outras corretoras que você admira ou compete)
2. Referências nacionais (grandes corretoras / influencers de seguros)
3. Perfis de saúde em geral (que falam de bem-estar, prevenção)

Me passa de 5 a 10 @perfis, ou me diz "sugere você" que eu indico perfis pra analisar.
```

### Passo 2 — Coletar dados de cada perfil
Para cada perfil, analisar os últimos 9-12 posts:
- Temas que mais aparecem
- Formatos (carrossel, reels, post único, stories)
- Posts com mais engajamento (curtidas, comentários, salvamentos)
- Ganchos usados (primeiras frases, capas de carrossel)
- CTAs usados
- Frequência de postagem
- Tom de voz (educativo, vendedor, humanizado)

### Passo 3 — Entregar o relatório de inteligência
```
━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PESQUISA DE MERCADO — [data]
[X] perfis analisados
━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 O QUE ESTÁ EM ALTA
1. [tema/formato mais recorrente entre os perfis de sucesso]
2. [segundo tema em alta]
3. [terceiro]

💡 POSTS QUE MAIS PERFORMARAM
• [@perfil] — "[tema do post]" — [formato] — [por que funcionou]
• [@perfil] — "[tema]" — [formato] — [insight]

🎯 GANCHOS QUE FUNCIONAM
• "[exemplo de gancho/capa que viralizou]"
• "[outro]"

📱 FORMATOS EM ALTA
• [ex: Reels educativos curtos estão dominando]
• [ex: Carrosséis "mito vs verdade"]

⚪ OPORTUNIDADES (o que ninguém está fazendo)
• [gap que a corretora pode explorar]

━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ MINHAS RECOMENDAÇÕES PRA VOCÊ
━━━━━━━━━━━━━━━━━━━━━━━━━━
Com base na pesquisa, sugiro estes 5 posts:
1. [tema] ([formato]) — inspirado em [o que está funcionando]
2. ...

Quer que eu já crie algum desses posts completo (arte + copy + CTA)?
```

### Passo 4 — Transformar em conteúdo
Conectar com `/post-hoje` — pegar as melhores ideias da pesquisa e criar o post completo (arte premium, copy, gancho, frase de efeito, CTA, legenda).

## O que analisar em cada post de sucesso

| Elemento | Pergunta |
|---|---|
| Tema | Sobre o que fala? |
| Gancho | Como prende nos primeiros 3 segundos? |
| Formato | Carrossel, reels, post? |
| Engajamento | Tem muitos comentários/salvamentos? |
| CTA | O que pede pro seguidor fazer? |
| Tom | Educativo, vendedor, humanizado? |
| Frequência | Quantas vezes por semana posta? |

## Regras

1. **Inspirar, não copiar.** Pegar o que funciona e adaptar para a identidade da corretora — nunca plagiar.
2. **Focar em padrões.** Um post viral pode ser sorte. Vários posts no mesmo tema = tendência real.
3. **Dados sobre achismo.** Recomendar com base no que viu performar, não em opinião.
4. **Identificar gaps.** O ouro às vezes está no que NINGUÉM está fazendo.
5. **Sempre virar ação.** A pesquisa termina em ideias de conteúdo prontas para criar.

## Frequência recomendada

Fazer pesquisa de mercado 1x por mês — o suficiente para captar tendências sem virar obsessão. O conteúdo do dia a dia sai do `/post-hoje`.
