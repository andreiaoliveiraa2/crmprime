# Comando — /configurar-comissoes

> Configura as regras de comissão de cada operadora, perguntando ao comprador passo a passo. Sem isso, a MPA não consegue calcular comissões direito. Faz parte da instalação, mas pode rodar a qualquer momento para adicionar/ajustar operadoras.

## Triggers

- `/configurar-comissoes`
- "configurar comissões"
- "regras de comissão"
- "como recebo da [operadora]"
- "adicionar regra de comissão"

## Quem executa

Comando MPA → pergunta ao corretor → salva em `14_OPERADORAS/regras-comissao.md`

## Por que isso importa

Cada operadora paga diferente. Cada corretor tem um acordo diferente. A MPA não pode adivinhar — ela PERGUNTA. Com as regras certas, ela calcula comissão inicial e vitalício automaticamente a cada venda.

## Fluxo do questionário (UMA pergunta por vez)

### Passo 1 — Modelo geral
```
Vou configurar como você recebe comissão. Primeiro, o geral:

Você tem vendedores/subcorretores que recebem parte da comissão?
1. Não, trabalho sozinho (toda comissão é minha)
2. Sim, divido com vendedores/subcorretores
```
→ Se "não": pular as perguntas de split (tudo 100% do corretor)
→ Se "sim": perguntar o split em cada operadora

### Passo 2 — Por operadora (repetir para cada uma)
```
Vamos configurar a [operadora]. Me responde:

1. Qual o % total da comissão inicial? (ex: 100%, 120%)
```
→ Salvar `% total`

```
2. Em quantas parcelas essa comissão vem? (de 1 a 24)
```
→ Salvar `num_parcelas`

Se tem vendedores (Passo 1 = sim):
```
3. Como divide cada parcela entre empresa e vendedor? (deve somar 100%)
   Ex: 50% empresa / 50% vendedor
```
→ Salvar `split`

```
4. Essa operadora paga VITALÍCIO? (comissão recorrente enquanto o cliente fica)
   1. Sim
   2. Não
```
→ Salvar `tem_vitalicio`

Se sim:
```
5. Qual o % do vitalício? (ex: 2%, 3%)
```
→ Salvar `% vitalicio`

```
6. Tem desconto de imposto sobre a comissão?
   1. Não
   2. Sim — qual %?
```
→ Salvar `desconta_imposto` e `% imposto`

### Passo 3 — Confirmar
```
✅ Regra da [operadora] configurada:

• Comissão inicial: [%] em [X] parcelas
• Split: [emp/vend ou "100% você"]
• Vitalício: [sim X% / não]
• Imposto: [não / X%]

Confere? Quer configurar outra operadora?
```

### Passo 4 — Repetir ou finalizar
Repetir para cada operadora que o corretor trabalha. Ao terminar:
```
Pronto! Configurei [X] operadoras. Agora, toda venda que você registrar,
eu calculo a comissão certinha — inicial e vitalício. 🎉
```

## Como calcular (regra do sistema)

**Comissão inicial:**
```
valor_comissao = valor_plano × (% total / 100)
por parcela: dividido em num_parcelas
split: valor × (% empresa/100) e valor × (% vendedor/100)
```

**Vitalício (se tem):**
```
valor_vitalicio_mensal = valor_plano × (% vitalício / 100)
recorrente todo mês
split na mesma proporção empresa/vendedor
```

**Imposto (se desconta):**
```
valor_liquido = valor_comissao × (1 - % imposto/100)
```

## Onde salva

`14_OPERADORAS/regras-comissao.md` — tabela de regras por operadora.

## Regras

1. **Nunca inventar percentuais** — sempre perguntar ao corretor.
2. **Split deve somar 100%** — avisar se não somar.
3. **Parcelas entre 1 e 24** — validar.
4. **Corretor sem vendedor** — simplificar (100% dele, sem split).
5. **Confirmar cada operadora** antes de salvar.
6. **Pode rodar de novo** para adicionar/editar operadoras depois.

## Conexão

- Faz parte da instalação (`instalar-mpa`)
- Alimenta o cálculo do financeiro e o dashboard
- Trabalha junto com `importar-clientes` (regras + clientes = financeiro completo)
