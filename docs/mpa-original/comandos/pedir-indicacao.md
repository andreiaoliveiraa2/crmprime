# Comando — /pedir-indicacao

> Ativa o canal mais barato e que mais converte: indicação. A MPA identifica quais clientes estão no momento certo de indicar e gera o pedido natural — sem constranger. Indicação = lead quente de graça.

## Triggers

- `/pedir-indicacao`
- "pedir indicação"
- "pedir indicações"
- "quem pode me indicar"
- "programa de indicações"
- "indicação"

## Quem executa

Comando MPA → Batman (identifica quem está pronto) → Mulher Maravilha (escreve o pedido) → Flash (entrega)

## Por que indicação é ouro

- Lead de indicação converte 3-5x mais que lead frio
- Custa ZERO (sem tráfego pago)
- Cliente de indicação cancela menos (já vem com confiança)
- Um cliente satisfeito pode gerar 2-3 indicações por ano

O problema: a maioria das corretoras esquece de pedir, ou pede na hora errada e constrange. A MPA resolve os dois.

## Modos de uso

### Modo 1 — Varredura (padrão)
A corretora digita "pedir indicação". A MPA lê `05_WORKSPACE/base-segurados.md` e identifica quem está no momento certo.

### Modo 2 — Cliente específico
A corretora diz "pedir indicação pro João". A MPA gera o pedido certo para o momento dele.

## Fluxo do Modo 1

### Passo 1 — Identificar o momento certo
A MPA procura na base clientes em momentos ideais para pedir:

| Momento na base | Por que é ideal |
|---|---|
| Completou 90 dias satisfeito | Já experimentou o plano e gostou |
| Aniversário de 1 ano de apólice | Relacionamento consolidado |
| Elogiou recentemente / resolveu problema | Gratidão fresca |
| Usou o plano e teve boa experiência | Viu o valor na prática |

E EXCLUI quem NÃO deve receber pedido:
- Reclamou nos últimos 60 dias
- Está em risco de cancelamento
- Já indicou nos últimos 90 dias (não saturar)

### Passo 2 — Montar a lista
```
[nome], encontrei [X] clientes no momento perfeito pra pedir indicação:

🎯 PRONTOS PARA INDICAR
1. Maria Silva — completou 90 dias, sem reclamações
2. João Costa — aniversário de 1 ano de apólice hoje
3. Ana Souza — elogiou o atendimento semana passada

Quer que eu prepare o pedido pra cada um?
```

### Passo 3 — Gerar o pedido personalizado
Para cada cliente, criar o pedido no momento e tom certos:

**Pós-90 dias:**
```
Oi [nome]! Já faz 3 meses que você está com o plano e fico feliz que está tudo certo. 😊

Posso te pedir um favor? Você conhece alguém — amigo, familiar, colega — que também esteja precisando de um bom plano de saúde?

Uma indicação sua é o maior reconhecimento do meu trabalho, e eu cuido de cada pessoa que você indicar com o mesmo carinho que cuidei de você. 💙
```

**Aniversário de apólice:**
```
[nome], hoje faz 1 ano que você confiou em mim pra cuidar da sua saúde! 🎉

Obrigada pela confiança. Se você conhece alguém que precisa de um plano, pode me indicar de olhos fechados — vou cuidar com todo cuidado, como cuido de você.
```

**Após elogio/problema resolvido:**
```
[nome], fico muito feliz que deu tudo certo! 😊

Já que você confia no meu trabalho, posso te fazer um convite: se tiver alguém precisando de plano de saúde, me indica? Cuido de cada indicação sua com atenção total.
```

### Passo 4 — Registrar e acompanhar
Quando a corretora pedir, registrar na base. Quando vier uma indicação:
- Adicionar o indicado no `funil-comercial.md` com tag "indicação de [nome]"
- Marcar para agradecer o indicador depois

### Passo 5 — Agradecer (fechamento do ciclo)
Quando a indicação fechar, gerar agradecimento:
```
[nome do indicador], o [nome do indicado] que você me indicou fechou o plano! 🎉

Muito obrigada pela confiança e por lembrar de mim. Indicações como a sua são o que fazem meu trabalho valer a pena. 💙
```

## Regras

1. **Nunca pedir para insatisfeito.** Verificar status antes — quem reclamou não recebe pedido.
2. **Momento certo é tudo.** Pedir quando o cliente está feliz, não aleatoriamente.
3. **Natural, nunca forçado.** O pedido não pode parecer script decorado.
4. **Respeitar intervalo.** Não pedir para o mesmo cliente em menos de 90 dias.
5. **Sempre agradecer.** Mesmo que a indicação não feche.
6. **Lead indicado é VIP.** Mencionar quem indicou no primeiro contato.
7. **Registrar tudo.** Rastrear quem indicou quem para fechar o ciclo de gratidão.

## Conexão com outros comandos

- Lead indicado entra no `/follow-up` com prioridade
- Cliente que indica muito → reconhecer no "o que temos hoje"
- Após retenção bem-sucedida → momento de pedir indicação
