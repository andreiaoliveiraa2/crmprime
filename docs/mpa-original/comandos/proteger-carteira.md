# Comando — /proteger-carteira

> O comando que protege o vitalício — onde está o dinheiro de verdade da corretora. Identifica clientes em risco ANTES de cancelarem e gera a ação certa para reter. Cada cliente retido = anos de comissão preservada.

## Triggers

- `/proteger-carteira`
- "proteger carteira"
- "quem está em risco"
- "retenção"
- "cliente quer cancelar"
- "minha carteira"

## Quem executa

Comando MPA → Batman (analisa a carteira) → Mulher Maravilha (cria scripts de retenção e relacionamento) → Flash (entrega)

## Por que esse comando vale ouro

A comissão da corretora é vitalícia — ela ganha enquanto o cliente fica. Um cliente que cancela não é uma perda única, é a perda de ANOS de comissão. A maioria das corretoras só descobre o cancelamento quando já aconteceu. A MPA vira o jogo: detecta o risco antes e age.

## Modos de uso

### Modo 1 — Varredura de risco (padrão)
A corretora digita "quem está em risco". A MPA lê `05_WORKSPACE/base-segurados.md` e identifica todos os clientes em situação de risco.

### Modo 2 — Cliente quer cancelar (urgente)
A corretora diz "fulano quer cancelar". A MPA aciona o fluxo de retenção na hora, com script personalizado para o motivo.

### Modo 3 — Relacionamento proativo
A corretora pede "quem preciso contatar essa semana". A MPA lista clientes para contato de relacionamento (aniversário, 1 ano de apólice, check-in).

## Fluxo do Modo 1 (varredura de risco)

### Passo 1 — Ler a base e identificar riscos

| Sinal na base | Nível de risco |
|---|---|
| Cliente marcado como "Em risco" | 🔴 Alto |
| Reclamou nos últimos 60 dias | 🔴 Alto |
| Sem contato há mais de 90 dias | 🟡 Médio |
| Reajuste por faixa etária se aproximando | 🟡 Médio |
| Mais de 3 anos de carteira (cansaço/comparação) | 🟡 Médio |
| Cliente novo nos primeiros 90 dias (frágil) | 🔵 Atenção |

### Passo 2 — Montar o alerta
```
[nome], olhei sua carteira. Atenção a estes clientes:

🔴 RISCO ALTO (agir hoje)
1. Maria Silva — reclamou do reajuste há 2 semanas
2. João Costa — sem contato há 5 meses

🟡 ATENÇÃO (essa semana)
3. Pedro Lima — completa reajuste de faixa em 30 dias
4. Ana Souza — 3 anos de plano, nunca foi contatada

🎂 RELACIONAMENTO (oportunidade)
5. Carlos Dias — aniversário de 1 ano de apólice hoje!
   (momento perfeito pra fortalecer e pedir indicação)

Quer que eu prepare a abordagem pra cada um?
```

### Passo 3 — Gerar a ação certa para cada caso

| Caso | Ação gerada |
|---|---|
| Reclamou do reajuste | Script de retenção + alternativas (portabilidade, ajuste de plano) |
| Sumiu há meses | Mensagem de reconexão genuína (não parecer que só lembra quando precisa) |
| Reajuste chegando | Comunicação proativa antes que ele se assuste e ligue bravo |
| 3+ anos sem contato | Check-in de relacionamento + revisão de plano |
| Aniversário de apólice | Mensagem de comemoração + abertura para indicação |

### Passo 4 — Entregar prontas
Mensagens personalizadas, no tom da corretora, prontas para enviar.

### Passo 5 — Atualizar a base
Após o contato, registrar em `base-segurados.md` na coluna "Último contato" e mudar o status se necessário.

## Fluxo do Modo 2 (cliente quer cancelar — URGENTE)

Quando a corretora diz "fulano quer cancelar":

1. Perguntar o MOTIVO (preço, rede, não usa, vai pro plano da empresa)
2. Carregar o script certo de `11_WHATSAPP_STACK/fluxos/retencao.md`
3. Personalizar para o cliente e a situação
4. Lembrar a corretora: "Antes de aceitar o cancelamento, vamos tentar reter — cada cliente desse vale [X meses] de comissão"
5. Se a retenção não for possível, gerar a saída digna + pedido de indicação

## Regras

1. **Retenção é conversa, não pressão.** Entender o motivo antes de argumentar.
2. **Cliente que reclama e é bem atendido vira o mais fiel.** Tratar reclamação como oportunidade.
3. **Nunca apresentar reajuste sem alternativa.** Sempre mostrar opções.
4. **Relacionamento contínuo, não só na hora do problema.** Contato proativo é o que previne cancelamento.
5. **Aniversário de apólice = ouro.** Cliente satisfeito + momento especial = melhor hora de pedir indicação.
6. **Registrar motivo de cada cancelamento** que não deu pra reverter — aprendizado para o futuro.

## Conexão com outros comandos

- Cliente retido satisfeito → acionar `/pedir-indicacao`
- Cliente quer mudar de plano → avaliar portabilidade (mantém na carteira)
- Padrão de cancelamento detectado → reportar no "o que temos hoje"
