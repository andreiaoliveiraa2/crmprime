# Comando — /squad-conteudo

> Roda o Squad de Inteligência de Conteúdo: 7 agentes que monitoram os 12 perfis cadastrados, captam o que está em alta no mercado de saúde e entregam um plano de conteúdo + posts prontos. É a corretora postando com base em dados, não em achismo.

## Triggers

- `/squad-conteudo`
- "roda o squad"
- "squad de conteúdo"
- "inteligência de conteúdo"
- "o que está bombando"

## Pré-requisito

- Perfis cadastrados em `22_SQUAD_INTELIGENCIA/perfis-monitorados.md`
- Acesso ao Instagram para monitorar de verdade:
  - **Com Composio ou Playwright conectado:** a MPA acessa os perfis e analisa automaticamente
  - **Sem conexão (modo manual):** a corretora cola os perfis/prints e a MPA analisa — funciona igual, só muda que ela alimenta os dados

## PRINCÍPIO INEGOCIÁVEL — inspirar, nunca copiar

⚠️ O squad serve para CAPTAR ASSUNTOS e OPORTUNIDADES (o que está em alta, um tema do momento, uma dúvida quente) — NUNCA para copiar a arte ou o post do concorrente.

| O squad faz | O squad NÃO faz |
|-------------|-----------------|
| Aponta um tema quente | Copia o post do concorrente |
| Avisa de uma oportunidade | Imita a arte de alguém |
| Sugere um ângulo | Vende cópia como original |

As artes da corretora são SEMPRE criadas pelos agentes, com a identidade visual e o conteúdo DELA. O Espião é um radar de assuntos, não um molde. São coisas distintas e separadas.

## Como funciona

O Comando MPA aciona os 7 agentes do squad EM SEQUÊNCIA. Cada um faz sua parte e passa para o próximo.

### Fluxo do squad

```
1. VIGIA monitora os 12 perfis → coleta posts recentes
   ↓
2. ANALISTA DE TENDÊNCIAS → identifica o que se repete
   ↓
3. CAÇADOR DE GANCHOS → extrai os ganchos que mais engajaram
   ↓
4. ESPIÃO DE FORMATOS → mapeia formatos em alta
   ↓
5. DETETIVE DE GAPS → acha o que ninguém está fazendo
   ↓
6. TRADUTOR DE NICHO → adapta tudo para saúde suplementar
   ↓
7. ESTRATEGISTA → entrega o plano + posts prontos
```

### Entrega final

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SQUAD DE CONTEÚDO — Relatório
[12 perfis monitorados] · [data]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 QUEM POSTOU O QUÊ (a varredura — economiza você entrar de um em um)

@perfil1 postou:
• "[título/tema do post]"
  Formato: [carrossel/reels/post/stories] · Há [X dias]
  Engajamento: [X curtidas · X comentários · salvamentos se visível]
  Gancho usado: "[primeira frase / capa]"
  🔗 [link do post]

@perfil2 postou:
• "[título/tema]"
  Formato: [...] · Há [X dias]
  Engajamento: [...]
  Gancho: "[...]"
  🔗 [link]

... (cada perfil com seus posts recentes, sempre com o @ na frente)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 EM ALTA NO MERCADO
[o que mais apareceu — cruzando todos os perfis]

🎣 GANCHOS QUE FUNCIONARAM
[os melhores ganchos captados]

📱 FORMATOS DOMINANTES
[o que está performando]

⚪ GAPS (sua oportunidade)
[o que ninguém está fazendo]

✨ SEU PLANO DE CONTEÚDO (próximos 5 posts)
1. [tema] ([formato]) — baseado em [insight]
2. ...

Quer que eu crie algum desses posts completo agora?
(arte + copy + gancho + frase de efeito + CTA + legenda)
```

> O bloco "QUEM POSTOU O QUÊ" é o que substitui a corretora entrar perfil por perfil
> manualmente. Ela bate o olho e vê tudo que cada @ postou, sem abrir o Instagram 12 vezes.
> Pode pedir versão resumida ("só o resumo") ou detalhada ("mostra tudo que cada um postou").

## Conexão

- A saída do squad alimenta o `/post-hoje` e o `/calendario-conteudo`
- Rodar 1x por semana ou mês
- O resultado fica salvo para consulta

## Modo manual (sem Composio/Playwright)

Se não tiver acesso automático ao Instagram:
```
[nome], pra eu analisar os perfis, me ajuda assim:

Entra em cada perfil da sua lista e me cola:
- Os 3 posts mais recentes de cada um
- (ou print da grade do perfil)

Pode ser de 3-4 perfis pra começar. Eu analiso e te dou o relatório.
```

A inteligência funciona igual — só muda que a corretora alimenta os dados.
