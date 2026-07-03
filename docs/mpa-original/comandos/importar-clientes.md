# Comando — /importar-clientes

> Tira a maior barreira de começar a usar a MPA. O corretor já tem os clientes em planilha ou PDF? A MPA importa tudo, pergunta o que falta, e em minutos a carteira está montada e o dashboard funcionando. Sem digitar nada.

## Triggers

- `/importar-clientes`
- "importar clientes"
- "importar minha carteira"
- "tenho os clientes numa planilha"
- "importar do pdf"
- "subir minha base"

## Quem executa

Comando MPA → Batman (lê e extrai) → Capitão América (organiza na base) → confirma com a corretora

## O que aceita

| Formato | Como lê |
|---------|---------|
| Planilha Excel (.xlsx) | Lê as colunas e importa |
| Google Sheets | Lê via link ou exportação |
| PDF (relatório, lista) | Extrai os dados do texto |
| Print/foto de lista | Transcreve a imagem |
| Texto colado | Organiza o que a corretora colar |

## Fluxo

### Passo 1 — Receber o arquivo
```
[nome], me manda sua planilha ou PDF de clientes (anexa aqui).
Pode ser do jeito que estiver — eu me viro pra organizar. 😉
```

### Passo 2 — Perguntar sobre vitalício (IMPORTANTE)
Antes de importar, entender o modelo de comissão do corretor:
```
Antes de importar, me diz uma coisa importante:

Você recebe VITALÍCIO? (comissão recorrente enquanto o cliente fica)

1. Sim, recebo vitalício de todos
2. Sim, mas só de alguns clientes/operadoras
3. Não, recebo só a comissão inicial

Isso muda como eu calculo seu financeiro.
```
→ Salvar em `.claude/config.md`: `recebe_vitalicio` (todos / alguns / nenhum)

### Passo 3 — Ler e mapear os dados
A MPA identifica no arquivo (mesmo que as colunas tenham nomes diferentes):
- Nome do cliente
- Operadora
- Data de início / contratação
- Valor do plano
- Comissão (se tiver)
- Quantidade de vidas (se tiver)
- Tipo (vitalício / inicial) — se o corretor marcou

### Passo 4 — Perguntar o que faltar
Para cada informação importante que faltar, perguntar (sem inventar):
```
Importei [X] clientes! Mas faltam algumas informações:

• 12 clientes sem data de início — você tem? (sem isso, não sei calcular o vitalício)
• 5 clientes sem operadora
• Os valores de comissão não vieram — quer adicionar agora ou depois?

Pode me passar, ou deixo marcado como "a completar" pra você preencher depois?
```

### Passo 5 — Tratar o vitalício
Com base na resposta do Passo 2:
- **Recebe de todos:** marcar todos os clientes ativos como vitalício
- **Só de alguns:** perguntar quais operadoras/clientes têm vitalício
- **Nenhum:** não contar vitalício no financeiro (só comissão inicial)

```
Sobre o vitalício: você disse que recebe de [operadoras X].
Vou marcar esses [Y] clientes como vitalício. Confere?
```

### Passo 6 — Confirmar e salvar
```
✅ Pronto, [nome]! Importei sua carteira:

• [X] clientes ativos
• [Y] de vitalício (renda recorrente)
• [Z] em comissão inicial
• Vitalício mensal estimado: R$ [valor]

Salvei tudo na sua base. Agora digita "bom dia" e vê seu dashboard
com a carteira toda funcionando! 🎉
```
→ Gravar em `05_WORKSPACE/base-segurados.md`

## Tratamento de erros (honesto)

| Situação | O que a MPA faz |
|----------|-----------------|
| Planilha organizada | Importa quase perfeito |
| PDF bagunçado | Importa o que dá, marca o resto como "conferir" |
| Dados faltando | Pergunta ou marca "a completar" — NUNCA inventa |
| Formato estranho | Pede pra corretora confirmar o que entendeu |

## Regras

1. **Nunca inventar dados.** O que faltar, perguntar ou marcar como pendente.
2. **Perguntar sobre vitalício SEMPRE** — é o que define o financeiro.
3. **Confirmar antes de salvar** — mostrar o resumo e pedir "está certo?".
4. **Respeitar a realidade de cada corretor** — uns têm vitalício, outros não.
5. **Dados sensíveis ficam locais** — a base é confidencial, nunca exposta.

## Por que esse comando é decisivo para a venda

A maior desculpa pra não usar um sistema é "vou ter que cadastrar tudo de novo". A MPA mata essa objeção: o corretor importa a planilha/PDF que já tem e em minutos está rodando. Da compra ao "funcionando" em 5 minutos.
