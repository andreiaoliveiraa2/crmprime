# Comando — /agendar-semana

> A automação de verdade: a corretora trabalha UMA vez por semana, aprova os posts, e a MPA publica sozinha nos dias certos. Piloto automático real — você programa e esquece.

## Triggers

- `/agendar-semana`
- "agendar semana"
- "programar posts"
- "postar a semana"
- "deixar agendado"

## Quem executa

Comando MPA → Squad de Inteligência (pesquisa) → Mulher Maravilha (cria) → Homem Aranha (revisa) → você aprova → Flash (agenda/publica via Composio)

## A promessa

```
Você, 1 vez por semana (ex: domingo):
1. Roda esse comando
2. A MPA cria os posts da semana inteira (com arte)
3. Você revisa e aprova
4. A MPA agenda tudo
5. Durante a semana, publica sozinha nos dias e horários certos

Você não toca em mais nada até a próxima semana.
```

## Fluxo completo

### Passo 1 — Gerar a semana
A MPA monta os 5 posts da semana (usa `/calendario-conteudo` + `/squad-conteudo`):
- Tema de cada dia
- Texto, gancho, frase de efeito, legenda, CTA
- Arte premium de cada um (HTML → imagem)
- Para qual perfil (empresa/pessoal)

### Passo 2 — Revisar tudo de uma vez
```
[nome], sua semana está pronta! Dá uma olhada:

📅 SEGUNDA — Carrossel "O que é carência"
   [preview da arte] [legenda]
📅 TERÇA — Stories enquete
   ...
📅 QUARTA — Reels objeção
   ...

Aprova tudo? Ou quer ajustar algum?
1. Aprovo tudo, pode agendar
2. Ajustar o de [dia]
```

### Passo 3 — Agendar a publicação
Após aprovação, para cada post:
- Hospedar a arte no Catbox
- Agendar a publicação via Composio no dia/horário definido
- Confirmar agendamento

```
✅ Semana agendada!

SEG 19h — Carrossel carência (perfil empresa)
TER 12h — Stories enquete (perfil pessoal)
QUA 19h — Reels objeção (perfil empresa)
QUI 12h — Post comparativo (perfil pessoal)
SEX 18h — Bastidores (perfil pessoal)

Pode descansar. Eu publico tudo nos horários certos. 😉
Te aviso quando cada um for ao ar.
```

### Passo 4 — Publicar automático
A MPA publica cada post no dia/horário agendado, sem a corretora precisar fazer nada.

## Pré-requisito (módulo avançado)

A publicação automática precisa de:
- **Composio** conectado (publica no Instagram) — ver `19_MCP_SETUP/`
- **Catbox** (hospeda as artes — grátis)

## Se NÃO tiver Composio (modo manual)

A MPA cria e organiza tudo, mas você posta manualmente:
```
[nome], sua semana está pronta e salva!

Cada dia tem o post completo (arte + legenda) guardado.
Quando chegar o dia, é só:
1. Abrir o post de hoje (digita "post de hoje")
2. Copiar a arte e a legenda
3. Postar

Quer que eu te lembre todo dia qual postar?
```

## Onde ficam salvos os posts

Os posts agendados ficam guardados (Notion, Drive ou pasta local, conforme a configuração da corretora) para consulta e reaproveitamento.

## Regras

1. **Aprovação obrigatória** antes de agendar — nunca publicar sem o "pode agendar".
2. **Avisar quando publicar** — a corretora recebe confirmação de cada post no ar.
3. **Respeitar horários de pico** por perfil.
4. **Compliance sempre** — Homem Aranha revisa antes.
5. **Modo manual sempre disponível** — quem não tem Composio também usa.

## Por que esse é o comando "piloto automático"

É a materialização da promessa da MPA: a corretora trabalha 1 hora no domingo e tem conteúdo no ar a semana inteira, sem tocar em mais nada. Isso é o que vale o preço — tempo de volta.
