# Comando — /follow-up

> O comando que ataca o maior gargalo da corretora: leads que não fecham. A MPA olha o funil, identifica quem está parado, e gera a mensagem certa para cada um. Follow-up que não escapa.

## Triggers

- `/follow-up`
- "follow up"
- "follow-up"
- "quem preciso cobrar"
- "leads parados"
- "quem não respondeu"

## Quem executa

Comando MPA → Batman (analisa o funil) → Mulher Maravilha (escreve as mensagens) → Flash (entrega prontas)

## O problema que resolve

A corretora envia cotação e o lead some. Ela esquece de cobrar. O lead esfria. A comissão evapora. A MPA não deixa isso acontecer — ela vigia o funil e avisa de quem cobrar, com a mensagem pronta.

## Modos de uso

### Modo 1 — Varredura do funil (padrão)
A corretora digita "follow up" sem dizer nome nenhum. A MPA lê `05_WORKSPACE/funil-comercial.md`, identifica todos que precisam de follow-up hoje e gera as mensagens.

### Modo 2 — Lead específico
A corretora diz "follow up do João". A MPA pega o contexto do João no funil e gera a mensagem certa para a etapa dele.

### Modo 3 — Lead avulso
A corretora cola a conversa ("mandei cotação pra Maria ontem, ela não respondeu"). A MPA gera o follow-up na hora, sem precisar estar no funil.

## Fluxo do Modo 1 (varredura)

### Passo 1 — Ler o funil
Abrir `05_WORKSPACE/funil-comercial.md` e identificar quem precisa de follow-up hoje:

| Situação no funil | Ação |
|---|---|
| Lead quente sem resposta há 1 dia | Follow-up urgente (Mensagem 1) |
| Cotação enviada há 2 dias sem retorno | Follow-up de valor (Mensagem 2) |
| Cotação enviada há 3 dias | Follow-up de urgência (Mensagem 3) |
| Sem resposta há 7 dias | Última tentativa (Mensagem 4) |
| Parado há 30+ dias | Reativação (fluxo de reativação) |

### Passo 2 — Montar a lista
```
[nome], encontrei [X] leads que precisam de follow-up hoje:

🔴 URGENTES (lead quente esfriando)
1. João Silva — cotação enviada ontem, sem resposta
2. Maria Costa — disse que ia pensar, 3 dias parada

🟡 ATENÇÃO (cotação sem retorno)
3. Pedro Lima — cotação há 2 dias
4. Ana Souza — cotação há 3 dias

🔵 RESGATE (parados há tempo)
5. Carlos Dias — 8 dias sem resposta (última tentativa)

Quer que eu gere as mensagens pra todos ou pra algum específico?
```

### Passo 3 — Gerar as mensagens
Para cada lead, gerar a mensagem da etapa certa, JÁ PERSONALIZADA com:
- Nome do lead
- Tipo de plano que ele buscava
- Contexto da última conversa
- Tom de voz da corretora (do `.claude/config.md`)

Usar como base os modelos de `11_WHATSAPP_STACK/fluxos/follow-up.md`, mas adaptar ao caso real.

### Passo 4 — Entregar prontas
```
Prontas pra copiar e colar:

━━━━━━━━━━━━━━━━━━━━━
👤 JOÃO SILVA (follow-up urgente)
━━━━━━━━━━━━━━━━━━━━━
[mensagem personalizada]

━━━━━━━━━━━━━━━━━━━━━
👤 MARIA COSTA (resposta ao "vou pensar")
━━━━━━━━━━━━━━━━━━━━━
[mensagem personalizada]

...

Depois de enviar, me avisa que eu atualizo o funil. 😉
```

### Passo 5 — Atualizar o funil
Quando a corretora confirmar o envio, atualizar a coluna "Última ação" e "Próxima ação" de cada lead no `funil-comercial.md`.

## Regras

1. **Personalizar SEMPRE.** Nunca mandar a mensagem genérica do template — adaptar ao lead real.
2. **Respeitar o tom da corretora.** Se ela é acolhedora, a mensagem é acolhedora.
3. **Nunca prometer valor/cobertura.** Seguir as regras de compliance de seguros.
4. **Priorizar por temperatura e tempo.** Lead quente parado = prioridade máxima.
5. **Não sugerir follow-up agressivo.** Respeitar o ritmo — máximo 1 mensagem por etapa.
6. **Se o lead pediu para parar, parar.** Mover para "perdido" e não insistir.
7. **Sempre oferecer atualizar o funil** depois do envio.

## Por que esse comando é ouro

A corretora não perde mais lead por esquecimento. Toda manhã (ou quando quiser), ela digita "follow up" e a MPA já entrega a lista de quem cobrar + as mensagens prontas. É literalmente comissão que estava escapando e agora não escapa mais.
