# OS MPA

O OS MPA existe para reduzir custo de contexto e aumentar confiabilidade na operacao da corretora.

## Componentes

- `cos.md` — entry point e gestor de tasks. Chief of Staff da [Nome da Corretora].
- `bootstrap.md` — sequencia de inicializacao.
- `router.md` — tabela de roteamento por intencao (14 departamentos).
- `model-router.yaml` — slots de modelos por etapa e politica de upgrade/downgrade.
- `context-economy.md` — budgets de tokens e regras de lazy loading.
- `cache-policy.md` — TTL e compactacao de contexto.
- `access-preflight.md` — validacao inicial de pastas, acessos, portais de operadoras e limites.
- `proactivity-policy.md` — politica de full-auto prudente para corretora de saude.
- `clients-map.yaml` — mapa global de leads e segurados sem segredos.
- `knowledge-loader.md` — quando carregar cada diretriz.
- `task-manager.md` — lifecycle de tarefas, fila e ledger.
- `gates.md` — validacoes bloqueantes (incluindo gates de cotacao, proposta e conteudo).
- `gate-matrix.md` — severidade e decisao de rework.
- `handoffs.md` — contratos entre departamentos da corretora.
- `commands/` — comandos operacionais.

## Filosofia do MPA

O MPA troca "muitos agentes e muitos arquivos" por "poucos agentes, contracts pequenos e escalada sob demanda". Cada task tem contrato de entrada/saida, budget de contexto e gate de qualidade.

Para operacao com a corretora, o preflight deve concentrar acessos no inicio. O sistema deve agir mais, perguntar menos e bloquear apenas quando houver risco real: credencial, cotacao com valor inventado, promessa de cobertura, envio de proposta sem aprovacao, disparo ou acao irreversivel.

Para conectar ferramentas externas (Gmail, Calendar, WhatsApp, Filesystem, Playwright), use `19_MCP_SETUP/`.

Para criar agentes, skills, tasks ou diretrizes novas, use `21_BUILDER_KIT/` (Forge agent).

## Regra de ouro

O CoS deve ser barato. Se o CoS esta lendo diretriz de operadora, montando cotacao ou escrevendo script de venda em profundidade, ele saiu da funcao dele.
