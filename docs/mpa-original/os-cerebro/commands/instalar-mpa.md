# Command — /instalar-mpa

> **Wizard unico de instalacao do MPA.** Roda 1 vez por maquina. Cobre dependencias + MCPs + onboarding da corretora + primeira tarefa.

## Triggers

- `/instalar-mpa`
- "instalar mpa"
- "instalar maquina"
- "comecar a usar"
- "primeira instalacao"
- "primeira vez"

## Objetivo final

Ao terminar o wizard, a corretora tem:

1. Dependencias base instaladas (Node, npm).
2. `.env` local configurado.
3. MCPs Tier 1 ativos (Gmail, Calendar, Filesystem, Playwright).
4. Projects do Claude Desktop criados (se estiver no app).
5. Context do negocio salvo (`.claude/config.md` + `current-context.md`).
6. Perfil operacional classificado.
7. Primeira tarefa util gerada.

## Identificacao de plataforma

ANTES de comecar, detectar onde esta rodando:

```bash
# Tentar:
uname -s 2>/dev/null     # Mac/Linux retorna Darwin/Linux
ver 2>/dev/null          # Windows CMD
$PSVersionTable.OS       # PowerShell

# Detectar Claude Code vs Desktop:
# - Claude Code: tem acesso a Bash, PowerShell, Read/Write/Edit tools nativos
# - Claude Desktop: sem Bash nativo. Tem que orientar corretora a abrir terminal proprio.
```

Variavel mental: `PLATFORM` (`code` ou `desktop`).

## Fluxo

### Etapa 0 — Boas-vindas + confirmacao

Mensagem a corretora:

```text
Beleza, vou te ajudar a instalar a Maquina que Produz Apolice (MPA).

O processo tem 7 etapas e leva uns 15-20 minutos:

1. Conferir dependencias do seu computador
2. Configurar arquivo .env
3. Ativar MCPs essenciais (Gmail, Calendar, etc.)
4. Criar Projects no Claude Desktop (se voce usa o app)
5. Te conhecer (corretora, operadoras, regiao, gargalo)
6. Classificar seu perfil operacional
7. Gerar sua primeira tarefa util

Comecar? (sim / ainda nao)
```

Se "ainda nao": parar e dar opcao de retomar depois.
Se "sim": seguir.

### Etapa 1 — Conferir dependencias

#### No Claude Code

```bash
node --version           # esperar >= v18
npm --version
git --version
```

Se faltar Node:
- **Mac:** `brew install node` (precisa Homebrew)
- **Windows:** baixar em https://nodejs.org (versao LTS)
- **Linux:** `sudo apt install nodejs npm` ou via nvm

Confirma com corretora antes de qualquer install que afeta sistema.

#### No Claude Desktop

Orientar corretora:

```text
Pra continuar, preciso que voce confira se tem Node.js instalado.

1. Abre o PowerShell (Windows) ou Terminal (Mac/Linux)
2. Cola: node --version
3. Me manda o resultado aqui

Se aparecer "command not found" ou erro, eu te ajudo a instalar.
Se aparecer "v20.X.X" ou similar, ta tudo certo.
```

Aguarda resposta. Se Node faltar, da link de download.

### Etapa 2 — Configurar .env

Verifica se `.env` ja existe. Se nao:

#### No Code

```bash
cp .env.example .env       # Mac/Linux
copy .env.example .env     # Windows
```

#### No Desktop

```text
Pra criar o arquivo de configuracao:

1. No PowerShell/Terminal, navega ate a pasta do MPA:
   cd <caminho do MPA>

2. Cola:
   copy .env.example .env  (Windows)
   cp .env.example .env    (Mac/Linux)

3. Me avisa quando terminar.
```

Pergunta dados nao-sensiveis pra preencher (CORRETORA_NOME, CORRETORA_REGIAO). NAO pede token nem credencial no chat.

### Etapa 3 — MCPs Tier 1

Pergunta a corretora:

```text
Vou ativar conectores essenciais. Quais voce precisa? (responde com numeros, ex: 1, 2, 3)

1. Gmail (ler e-mails de leads, operadoras e segurados) - RECOMENDADO
2. Google Calendar (agendar reunioes, follow-ups, lembretes) - RECOMENDADO
3. Filesystem (acesso facil a pastas locais, propostas, apolices) - RECOMENDADO
4. Playwright (auditar sites e capturar screenshots) - opcional

Recomendado pra toda corretora: 1, 2 e 3.
Pra quem tem site ou portal: 1, 2, 3 e 4.
```

Pra cada selecionado:

#### No Code

```bash
# Gmail
claude mcp add gmail -- npx -y @anthropic-ai/claude-code-gmail-mcp

# Google Calendar
claude mcp add google-calendar -- npx -y @anthropic-ai/claude-code-google-calendar-mcp

# Filesystem
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem "$PWD"

# Playwright
claude mcp add playwright -- npx -y @anthropic-ai/claude-code-playwright-mcp
```

#### No Desktop

```text
No Desktop, MCPs sao configurados manualmente no arquivo claude_desktop_config.json.

Vou te dar o caminho do arquivo e o que colar dentro:

[Mac]: ~/Library/Application Support/Claude/claude_desktop_config.json
[Windows]: %APPDATA%\Claude\claude_desktop_config.json
[Linux]: ~/.config/Claude/claude_desktop_config.json

Abre esse arquivo (com Notepad/TextEdit/VSCode) e cola:

{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/claude-code-gmail-mcp"]
    },
    "google-calendar": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/claude-code-google-calendar-mcp"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "<caminho do MPA>"]
    }
  }
}

Depois de salvar:
1. Fecha o Claude Desktop totalmente
2. Reabre
3. Me avisa
```

Valida com `claude mcp list` (Code) ou pedindo corretora testar comando MCP (Desktop).

### Etapa 4 — Projects do Claude Desktop (so se for Desktop)

Pular se estiver no Claude Code.

Se estiver no Desktop:

```text
O Claude Desktop usa Projects pra manter contexto por area. Vou te ajudar a criar 2:

1. MPA Hub (geral) - obrigatorio
2. MPA WhatsApp (so se voce atende muito por WhatsApp)

Quer criar os 2 ou so o Hub? (2 / so 1)
```

Pra cada Project:

1. Da instrucao pra corretora:
   - "Clica em + New Project na sidebar"
   - "Nome: [nome]"
   - "Cola system prompt: [conteudo do cos.md adaptado]"
   - "Faz upload dos arquivos: [lista de knowledge files]"
2. Aguarda confirmacao
3. Proximo Project

Detalhes completos em `20_CLAUDE_DESKTOP/setup-project.md`.

### Etapa 5 — Onboarding da corretora (PRINCIPAL)

Agora coleta info da corretora. Faz UMA pergunta de cada vez:

```text
Vou te conhecer pra adaptar o MPA. 7 perguntas rapidas.

1. Qual o nome da sua corretora/marca?
```

Aguarda resposta. Salva como `corretora.nome`.

```text
2. Quais operadoras voce trabalha?
   Ex: Hapvida, Bradesco Saude, SulAmerica, Amil, Unimed, etc.
```

Salva `corretora.operadoras`.

```text
3. Qual sua regiao principal de atuacao?
   Ex: Joao Pessoa/PB, Sao Paulo/SP, atuo em todo o Brasil, etc.
```

Salva `corretora.regiao`.

```text
4. Quais tipos de plano voce mais vende?
   - PF (pessoa fisica individual/familiar)
   - PJ/PME (empresarial)
   - Coletivo por adesao
   - Odontologico
   - Todos
```

Salva `corretora.tipos_plano`.

```text
5. Qual seu canal principal de vendas hoje?
   - WhatsApp / Instagram / Indicacao / Google / Site / outro
```

Salva `corretora.canal_principal`.

```text
6. Quantos segurados ativos voce tem na carteira hoje? (aproximado)
```

Salva `corretora.carteira_ativa`.

```text
7. Qual seu maior gargalo operacional hoje?
   Ex: leads que nao convertem, falta de follow-up, perco clientes pro concorrente,
   nao consigo atender todo mundo, nao tenho tempo de prospectar, etc.
```

Salva `corretora.gargalo`.

### Etapa 6 — Classificar perfil + criar context

Com base nas 7 respostas, classifica o perfil operacional:

| Sinais | Perfil |
|---|---|
| Foco em PF, poucos segurados, vende por indicacao | corretora-pf-individual |
| Foco em PJ/PME, ciclo B2B, multiplos decisores | corretora-pj-empresarial |
| Mix PF e PJ, carteira media, varios canais | corretora-mista |
| Volume alto, equipe, processos definidos | corretora-estruturada |
| Comecando, poucos clientes, construindo base | corretora-em-formacao |

Depois cria 2 arquivos:

#### `.claude/config.md`

```markdown
# Config da corretora

```yaml
corretora:
  nome: "<resposta 1>"
  operadoras: [<resposta 2>]
  regiao: "<resposta 3>"
  tipos_plano: [<resposta 4>]
  canal_principal: "<resposta 5>"
  carteira_ativa: "<resposta 6>"
  gargalo: "<resposta 7>"
  perfil: "<perfil classificado>"
tom_de_voz: "profissional acolhedor"
mcps_ativos: [<lista>]
first_task: "<primeira tarefa>"
created_at: "<data>"
```

## Operadoras configuradas

<lista de operadoras com status de acesso ao portal>

## Proximos passos

- <baseado no gargalo>
```

#### `05_WORKSPACE/current-context.md`

```yaml
projeto: "<nome da corretora>"
objetivo: "<inferido do gargalo>"
segurado:
operadora_atual:
tipo_plano:
vidas:
regiao: "<regiao>"
comissao:
status_apolice:
tom: "profissional acolhedor"
restricoes: []
status: "onboarded"
proxima_task: "primeira-tarefa"
arquivos_relevantes:
  - ".claude/config.md"
preflight_status: "instalacao_concluida"
```

### Etapa 7 — Gerar primeira tarefa util

Com base no perfil e gargalo, sugere primeira entrega. Pergunta:

```text
Pra fechar a instalacao com chave de ouro, vou gerar sua primeira entrega util agora.

Considerando seu cenario:
- Corretora: <nome>
- Perfil: <perfil>
- Maior gargalo: <gargalo>

Eu sugiro comecar com: <primeira-tarefa-sugerida>

Concorda ou prefere outra opcao? (sim / outra)
```

Opcoes por gargalo:

| Gargalo | Primeira tarefa default |
|---|---|
| Leads que nao convertem | Script de qualificacao + fluxo de follow-up |
| Falta de follow-up | Sequencia de follow-up por WhatsApp (3 mensagens) |
| Perco clientes pro concorrente | Comparativo de diferenciais + script de retencao |
| Nao consigo atender todo mundo | Fluxo de triagem automatica por WhatsApp |
| Nao tenho tempo de prospectar | Script de abordagem fria + mensagem de indicacao |
| Conversao baixa | Diagnostico do funil + script de fechamento |
| Nao tenho conteudo | Calendario editorial de 30 dias para saude suplementar |
| Carteira desorganizada | Checklist de organizacao + alertas de aniversario |

Roda a primeira tarefa **agora**, gerando o output.

### Etapa 8 — Resumo final

```text
Pronto! MPA instalada e adaptada pra sua corretora.

Verificado: Dependencias OK
Verificado: .env configurado
Verificado: MCPs ativos: <lista>
Verificado: Projects Desktop: <quantidade ou N/A>
Verificado: Perfil operacional: <perfil>
Verificado: Primeira tarefa gerada: <nome>

Salvei tudo em:
- .claude/config.md (perfil da sua corretora)
- 05_WORKSPACE/current-context.md (estado atual)
- 06_OUTPUTS/<data>_primeira-tarefa/ (sua primeira entrega)

Proximos comandos:

- /nova-cotacao - iniciar cotacao de plano
- /follow-up - gerar follow-up para lead
- /script-whatsapp - criar script de atendimento
- /pedir-indicacao - gerar script de indicacao
- /post-hoje - criar conteudo para redes sociais
- /relatorio-carteira - situacao da carteira ativa
- /resumo-do-dia - resumo de email + WhatsApp + agenda
- /preflight-acessos - verificar acessos e portais

Algum proximo passo? Posso:
1. Gerar outra entrega (cotacao, follow-up, script)
2. Montar fluxo de WhatsApp pra <gargalo>
3. Configurar mais MCPs
4. Explicar algo do MPA
```

## Regras de execucao

1. **NUNCA pedir token no chat.** Tokens vao no `.env` manualmente pela corretora.
2. **NUNCA executar acao destrutiva sem confirmacao.** Mesmo comandos com `rm`, `mv`, etc.
3. **Pause sempre que corretora precisar fazer algo manual.** Aguarde "feito" antes de seguir.
4. **Se etapa falhar, NAO MASCARAR.** Reporta o erro exato, sugere correcao, oferece pular.
5. **Corretora pode interromper a qualquer momento.** Salva progresso em `05_WORKSPACE/current-context.md`.
6. **Pra Desktop, sempre orientar passo a passo.** Sem suposicoes do que ela consegue rodar sozinha.
7. **Tudo em pt-BR coloquial profissional.**

## Saida estruturada (handoff)

Ao terminar:

```yaml
install_status: complete | partial | aborted
platform: code | desktop
corretora:
  perfil:
  configured: yes | no
mcps_active: []
projects_desktop: <num>
first_task_generated: yes | no
config_file: ".claude/config.md"
current_context: "05_WORKSPACE/current-context.md"
next_step: "<acao recomendada>"
pendencias: []
```

## Retomada

Se corretora parou no meio, ao rodar `/instalar-mpa` de novo:

1. Le `.claude/config.md` e `05_WORKSPACE/current-context.md`.
2. Identifica em qual etapa parou.
3. Pergunta: "Vi que voce ja instalou X. Quer continuar a partir de Y ou refazer do zero?"
4. Continua de onde parou.

## Erros comuns

| Sintoma | Solucao |
|---|---|
| `node: command not found` | Instalar Node antes de tudo (link nodejs.org) |
| `npx` retorna erro | Atualizar npm: `npm install -g npm@latest` |
| MCP nao aparece em `claude mcp list` | Reiniciar Claude Code |
| Project Desktop nao reconhece MPA | Re-upload knowledge files |
| `.env` nao foi criado | Conferir pasta certa (raiz do MPA) |
| Corretora sem permissao admin | Pular installs de sistema, marcar como pendente |
