# Bootstrap MPA

## Objetivo

Garantir que o sistema comece com estado minimo, sem pedir briefing inteiro quando ainda nao precisa.

## Sequencia

1. Ler `00_INDEX.md`.
2. Ler `00_OS/cos.md`.
3. Ler `00_OS/model-router.yaml`.
4. Ler `05_WORKSPACE/current-context.md`.
5. Ler `07_LOGS/task-ledger.md`.
6. Se houver lead/segurado novo, usar templates de `10_TEMPLATES_OPERACIONAIS/`.
7. Se pedido envolver conector externo (Gmail/Calendar/WhatsApp/Filesystem), consultar `19_MCP_SETUP/README.md`.
8. Se pedido envolver criar agente/skill/task/diretriz nova, acionar `21_BUILDER_KIT/agents/forge.md`.
9. Se pedido envolver operadora especifica, carregar dados da operadora relevante.

## Estado minimo aceito

```yaml
projeto:
objetivo:
status:
proxima_task:
```

Se so isso existir, o CoS ja pode criar uma task de discovery em vez de travar.

## Checklist

- [ ] Projeto ativo identificado.
- [ ] Task atual existe.
- [ ] Owner definido.
- [ ] Gate definido.
- [ ] Contexto ativo com menos de 120 linhas.
- [ ] Nenhum arquivo legado foi carregado sem motivo.
- [ ] Se envolve lead real, perfil minimo esta presente.
- [ ] Se envolve cotacao, operadoras da regiao estao identificadas.
