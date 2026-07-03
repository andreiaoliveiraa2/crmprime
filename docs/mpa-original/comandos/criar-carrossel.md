# Comando — /criar-carrossel

> O comando que entrega um carrossel completo e premium do começo ao fim: tema inteligente, copy, gancho, frase de efeito, CTA, legenda E a arte pronta — no estilo premium do KPA, com opção de incluir a foto e a logomarca da corretora. Você pede uma coisa, recebe o post pronto para publicar.

## Triggers

- `/criar-carrossel`
- "criar carrossel"
- "fazer um carrossel"
- "carrossel premium"
- "post com minha foto"

## Quem executa (fluxo completo)

```
Comando MPA
  → Squad de Inteligência (opcional: pesquisa o que está em alta)
  → Mulher Maravilha (escreve copy + gancho + frase de efeito + legenda)
  → Mulher Maravilha + Design (monta a arte premium)
  → Homem Aranha (revisa)
  → você aprova
  → Flash (entrega / publica via Composio)
```

## Passo a passo

## Modo livre (atalho rápido)

A corretora pode pular o passo a passo e pedir direto, mandando a foto na conversa:
```
"cria uma arte com essa foto sobre [tema]" + [anexa a foto]
```
Nesse caso: usar a foto enviada como base, aplicar a identidade visual da marca
(cores, fontes, logo) e escrever o texto sobre o tema. Entregar a arte.
A foto enviada na conversa tem prioridade sobre qualquer foto do banco.

## Fluxo guiado (passo a passo)

### Passo 0 — Para qual perfil?
```
[nome], esse carrossel é pra qual Instagram?

1. Empresa (institucional, foco na marca)
2. Pessoal (você aparece, tom próximo)
3. Os dois (adapto a mesma ideia pra cada um — economiza seu tempo)
```
> Verificar `05_WORKSPACE/minha-marca/perfis-instagram.md` para o tom e a configuração
> de cada perfil. Adaptar copy, foto e tom ao perfil escolhido.

### Passo 1 — Definir o tema
```
Perfeito! Sobre o que vai ser o carrossel?

1. Me dá o tema (ex: "carência", "como escolher plano")
2. Ou digita "usa o squad" que eu pesquiso o que está em alta e sugiro
3. Ou "tema do dia" que eu escolho baseado no seu calendário
```

### Passo 2 — Definir a identidade visual
> ANTES de desenhar, SEMPRE ler:
> - `05_WORKSPACE/minha-marca/identidade-visual.md` (cores, fontes, estilo, referências)
> - `05_WORKSPACE/minha-marca/quem-sou-eu.md` (persona, voz, como aparece)
> Usar isso para que a arte saia com a cara da corretora, não genérica.
> Se a corretora mandar um print de referência ("quero nesse estilo"), analisar a
> estrutura da referência e adaptar para a identidade visual dela.

```
Como você quer a arte?

🎨 ESTILO
Vou usar a sua identidade visual (cores, fontes e estilo do seu arquivo de marca).
Quer manter o seu padrão ou tem uma referência nova pra esse post?
1. Meu padrão de sempre
2. Tenho uma referência (mando o print)

📸 SUA IMAGEM
1. Quer aparecer no carrossel? Se sim, qual foto?
   a) Me manda uma foto nova agora (pra esse post específico)
   b) Uso a foto fixa da sua pasta minha-marca
2. Quer a logomarca nos cards? (recomendado pra fortalecer sua marca)
3. Outras imagens? (ex: foto de família feliz, hospital, etc. — me manda)
4. Sem foto, só design (mais clean)
```

> A corretora pode SEMPRE mandar uma foto diferente a cada post — muita corretora
> gosta de variar a foto. Aceitar a foto que ela colar/subir na hora.
> Verificar `05_WORKSPACE/minha-marca/` para a foto fixa e a logo como padrão,
> mas a foto nova que ela mandar tem prioridade para aquele post.

### Passo 3 — Escrever a copy (Mulher Maravilha)
Gerar o conteúdo completo:

```
🎣 GANCHO (capa): [frase que para o scroll]
✨ FRASE DE EFEITO: [conceito central memorável]

SLIDES:
1 (capa) — [gancho] [+ foto da corretora se escolhido]
2 — [ideia 1]
3 — [ideia 2]
4 — [ideia 3]
5 — [ideia 4]
6 — [resumo]
7 (CTA) — [chamada para WhatsApp] [+ logo]

📝 LEGENDA: [storytelling + CTA]
#️⃣ HASHTAGS: [5 relevantes]
```

### Passo 3.5 — Aplicar variação (nunca igual)
> Consultar `05_WORKSPACE/minha-marca/templates/estrategia-variacao.md`.
> Usar o template base do banco, mas VARIAR a composição: posição do texto/foto,
> ordem dos slides, elemento de destaque, cor de fundo (dentro da paleta da marca).
> Conferir que está diferente do último post. O que NUNCA muda: cores, fontes, logo,
> assinatura — isso é a identidade visual e deve ser sempre respeitada.

### Passo 4 — Gerar a arte (3 opções)

Perguntar:
```
Como quer gerar a arte?

1. No Canva (se tiver conectado — uso seus templates)
2. Prompt pronto pra Gemini (gero o prompt, você cola no Gemini e ele cria a arte)
3. Prompt pronto pra ChatGPT/DALL-E (mesmo processo)
```

#### Opção 1 — Canva conectado
Usar os templates do Brand Kit da corretora. Preencher texto, cores, logo automaticamente.

#### Opção 2 ou 3 — Prompt de arte pro Gemini/GPT
Gerar um prompt detalhado e pronto pra colar. O prompt DEVE conter:

```
Crie [QUANTIDADE] slides de carrossel premium para Instagram.
Formato: 1080x1350px (4:5 vertical).

ESTILO VISUAL
Estética premium, limpa, profissional — feed de corretor de alto padrão.
Muito respiro, sombras suaves, cantos arredondados.
Fonte sans-serif geométrica (estilo Poppins ou Urbanist).
Hierarquia clara: títulos bold grandes, texto de apoio menor.
Sem emojis na arte. Design de agência.

PALETA DE CORES
Cor principal: [cor principal da marca da corretora — pegar de identidade-visual.md]
Cor secundária: [cor secundária]
Fundo: [cor de fundo ou degradê]
Texto: branco ou [cor de contraste]
CTA: [cor de destaque para botões]

SLIDE 1 (CAPA)
Texto principal: "[GANCHO]"
Elemento visual: [foto da corretora / família sorrindo / ícone de saúde]
Logo da corretora no canto [posição]

SLIDE 2
Texto principal: "[título do slide]"
Texto de apoio: "[conteúdo curto]"

SLIDE 3
[...]

SLIDE [ÚLTIMO] (CTA)
Texto: "[chamada para ação]"
Ícone de WhatsApp + número: [WhatsApp da corretora]
Nome: [nome da corretora]
Logo no centro

REGRAS
- Cada slide deve ter visual diferente mas manter a mesma paleta
- Nunca repetir layout entre slides
- Texto curto — máximo 2 linhas por slide
- Pronto para anúncio patrocinado
```

Preencher TODAS as variáveis automaticamente com os dados da corretora (nome, WhatsApp, cores, logo) antes de entregar. A corretora só copia e cola no Gemini/GPT.

#### Fallback — Arte em HTML
Se nenhuma opção acima funcionar, gerar em HTML premium e abrir no navegador:
- Design premium, cards sóbrios mas VARIADOS
- Fontes premium combinadas
- Cores da marca da corretora
- Foto da corretora na capa (se escolhido)
- Logomarca no canto dos cards (se escolhido)
- Centralizado, sem emojis na arte

### Passo 5 — Revisar (Homem Aranha)
Checar: ortografia, tom, compliance de seguros (não prometer cobertura/valor), CTA presente.

### Passo 6 — Aprovar e publicar
```
Carrossel pronto! Dá uma olhada na web. 

Quer:
1. Publicar agora no Instagram (via Composio)
2. Ajustar alguma coisa
3. Salvar pra postar depois
```

> Publicação automática requer Composio (ver `prompts-design-instagram.md`).
> Sempre pedir aprovação antes de publicar — nunca publicar sem "pode postar".

## Estilo de carrossel (referência KPA premium)

- Capa com gancho forte + foto/elemento visual
- 1 ideia por slide, texto enxuto
- Hierarquia visual clara (título grande, apoio menor)
- Cores de fundo variadas mas harmônicas
- Último slide sempre com CTA + logo
- Visual de agência, não de template genérico

## FORMATOS (sempre criar no tamanho certo da rede)

| Tipo de conteúdo | Formato | Tamanho |
|------------------|---------|---------|
| Carrossel Instagram | 4:5 (vertical) | 1080×1350 |
| Post feed quadrado | 1:1 | 1080×1080 |
| Stories | 9:16 (vertical) | 1080×1920 |
| Reels | 9:16 (vertical) | 1080×1920 |
| TikTok | 9:16 (vertical) | 1080×1920 |

> SEMPRE perguntar ou identificar pra qual rede/formato é, e criar a arte no tamanho
> correto. Carrossel é 4:5 (ocupa mais o feed). Stories/Reels/TikTok são 9:16 (vertical cheio).
> Nunca entregar arte quadrada pra Stories nem vertical pra feed quadrado.

## Regras

1. **Formato correto sempre** — cada rede tem seu tamanho (ver tabela acima).
2. **Foto e logo fortalecem a marca.** No mercado de seguros, confiança vem da pessoa — sempre oferecer.
2. **Estilo premium sempre.** Nunca entregar design genérico ou amador.
3. **Compliance.** Homem Aranha revisa antes de publicar.
4. **Aprovação obrigatória** antes de qualquer publicação.
5. **Cores da marca da corretora** quando cadastradas.
6. **Tom educativo e acolhedor** — a corretora é a guia, não a vendedora.

## Por que esse comando é o "uau" do produto

A corretora digita "criar carrossel sobre carência com minha foto" e recebe, em minutos, um carrossel de qualidade de agência — com a cara dela, a marca dela, pronto para publicar. É isso que ela não consegue fazer sozinha e que justifica o produto.
