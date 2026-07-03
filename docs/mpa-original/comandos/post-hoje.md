# Comando — /post-hoje

> Acaba com o "não sei o que postar". A corretora digita e recebe o conteúdo do dia pronto: tema, texto, formato e instrução de publicação. Conteúdo que atrai cliente sem a corretora travar na frente da tela.

## Triggers

- `/post-hoje`
- "post hoje"
- "o que postar"
- "conteúdo de hoje"
- "cria um post"
- "preciso postar"

## Quem executa

Comando MPA → Mulher Maravilha (cria) → Homem Aranha (revisa) → Flash (entrega pronto)

## O problema que resolve

A corretora sabe que precisa postar, mas trava: "sobre o quê?", "como escrever?", "que formato?". Resultado: não posta, fica invisível, não gera lead. A MPA tira isso da frente — entrega o post pronto em segundos.

## Modos de uso

### Modo 1 — Post do dia (padrão)
A corretora digita "post hoje". A MPA sugere um tema baseado no calendário editorial e no dia da semana, e entrega o post completo.

### Modo 2 — Tema específico
A corretora diz "post sobre carência". A MPA cria o post sobre aquele tema.

### Modo 3 — Semana inteira
A corretora diz "conteúdo da semana". A MPA monta o calendário editorial completo (ver `/calendario-conteudo`).

## Fluxo do Modo 1

### Passo 1 — Escolher o tema
Baseado no dia da semana e nos 5 pilares de conteúdo (ver `02_AGENTS/conteudo.md`):

| Dia | Pilar sugerido |
|---|---|
| Segunda | Educativo (carência, portabilidade, coparticipação) |
| Terça | Engajamento (enquete, mito vs. verdade) |
| Quarta | Comparativo/orientação (quando trocar, o que avaliar) |
| Quinta | Objeção respondida ("é caro", "sou jovem") |
| Sexta | Bastidores/humanização ou data comemorativa |

### Passo 1.5 — Para qual perfil?
```
Esse post é pra qual Instagram?
1. Empresa (institucional)
2. Pessoal (você aparece, tom próximo)
3. Os dois (adapto pra cada um)
```
> Ver `05_WORKSPACE/minha-marca/perfis-instagram.md`. Adaptar tom e foto ao perfil.
> Empresa = institucional + logo. Pessoal = humano + sua foto.

### Passo 2 — Perguntar formato (se não especificado)
```
[nome], pra hoje sugiro um post sobre: [tema]

Que formato você prefere?
1. Carrossel (mais completo, educativo)
2. Post único (rápido, direto)
3. Reels (maior alcance)
4. Stories (interação)
```

### Passo 3 — Criar o PACOTE COMPLETO
Não entregar só texto. Entregar o pacote pronto para publicar, igual a uma agência:

```
━━━━━━━━━━━━━━━━━━━━━━━━
📱 POST DE HOJE — [tema]
Formato: [formato]
━━━━━━━━━━━━━━━━━━━━━━━━

🎣 GANCHO (para a capa / primeiros 3 segundos)
[frase que para o scroll]

✨ FRASE DE EFEITO (o conceito central do post)
[frase marcante e memorável]

📐 CONTEÚDO
[Para carrossel: os slides numerados]
SLIDE 1 (capa): [gancho visual]
SLIDE 2: [texto]
...
SLIDE FINAL: [CTA]

[Para post único/reels: o texto/roteiro completo]

📝 LEGENDA (pronta para copiar)
[legenda completa com storytelling]

📢 CTA
[chamada para ação clara — geralmente "chama no WhatsApp"]

#️⃣ HASHTAGS
[5 hashtags relevantes]

🎨 ARTE
[Ver Passo 3.1 — gerar a arte premium]

📅 MELHOR HORÁRIO: [horário sugerido]
```

### Passo 3.1 — Gerar a ARTE PREMIUM (design pronto)
Quando a corretora quiser a arte (não só o texto), seguir os prompts de design premium
de `15_PRODUCT_RELEASE/prompts-design-instagram.md`:

- Mulher Maravilha cria o design do carrossel em HTML/visual
- Cores: roxo (#7c3aed) + dourado (#d4a843) — ou a paleta da corretora
- Cards sóbrios mas variados (não alternar 2 cores)
- Fontes premium, sem emojis na arte
- Abrir na web para a corretora visualizar e aprovar
- Se tiver Composio: publicar direto no Instagram após aprovação

Isso entrega o post igual o KPA faz: arte + copy + gancho + frase de efeito + CTA + legenda, tudo pronto.

### Passo 4 — Oferecer publicação
```
Pronto pra postar! Quer que eu:
1. Crie a arte premium do carrossel (design pronto)
2. Ajuste alguma coisa no texto
3. Já te dou o próximo post da semana
```

> Se a corretora tiver Composio configurado, oferecer publicação automática
> (ver `15_PRODUCT_RELEASE/prompts-design-instagram.md`).

## Banco de temas que funcionam (corretora de saúde)

**Educativos:**
- O que é carência e como funciona
- Diferença entre plano individual, familiar e empresarial
- Como funciona a portabilidade
- Coparticipação explicada de forma simples
- O que o plano cobre que você não sabia
- Como ler a rede credenciada

**Objeções:**
- "Plano é caro?" → compare com emergência particular
- "Sou jovem e saudável, preciso?"
- "Já tenho plano da empresa, preciso de individual?"
- "Vou esperar adoecer pra contratar" (por que não dá)

**Datas:**
- Outubro Rosa (saúde da mulher)
- Novembro Azul (saúde do homem)
- Janeiro Branco (saúde mental)
- Dia Mundial da Saúde

**Bastidores:**
- Um dia na vida de uma corretora
- Como escolho o plano certo pra cada cliente
- História de cliente (anonimizada, com autorização)

## Regras

1. **Sempre entregar pronto.** A corretora copia e posta — não precisa pensar.
2. **Tom da corretora sempre.** Educativo, acolhedor, nunca vendedor agressivo.
3. **Educar antes de vender.** Proporção 9 conteúdos de valor para 1 de venda.
4. **CTA claro sempre.** Todo post termina levando pro WhatsApp.
5. **Nunca prometer cobertura/valor.** Compliance de seguros.
6. **Sugestão visual concreta.** A corretora precisa saber o que fazer no Canva.
