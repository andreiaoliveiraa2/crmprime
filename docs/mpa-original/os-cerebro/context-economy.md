# Economia de Contexto MPA

## Regra central

Contexto e custo. So carregue o que muda a decisao ou melhora diretamente o output.

## Budgets por papel

| Papel | Budget alvo | Pode carregar |
|---|---:|---|
| Comando MPA (CoS) | 800 tokens | indice, ledger, task atual, context pack |
| Prospeccao | 3.000 tokens | task + perfil do lead + diretriz de abordagem |
| Comercial | 5.000 tokens | briefing + tabelas de operadoras + perfil do lead + diretriz comercial |
| Atendimento | 3.000 tokens | task + historico resumido do segurado + duvida + diretriz de atendimento |
| Pos-venda | 3.000 tokens | dados do segurado + apolice + checklist de onboarding |
| Carteira | 4.000 tokens | lista de segurados + status de contratos + alertas de vencimento |
| Indicacoes | 2.000 tokens | segurados satisfeitos + script de indicacao + historico |
| Operadoras | 4.000 tokens | dados da operadora + pendencias + comissoes + prazos |
| Agenda | 2.000 tokens | compromissos + follow-ups pendentes + lembretes |
| Copywriter | 4.000 tokens | briefing + objecoes comuns + scripts anteriores + voz-ptbr |
| Conteudo | 4.000 tokens | briefing + calendario + temas anteriores + diretriz de conteudo |
| Social Media | 3.000 tokens | calendario editorial + metricas recentes + planejamento |
| Relatorios | 3.000 tokens | dados de carteira + conversoes + comissoes + periodo |
| Financeiro | 3.000 tokens | comissoes por operadora + extrato + projecoes |

## Context Pack

Todo projeto ativo deve ter um resumo curto em `05_WORKSPACE/current-context.md`:

```yaml
projeto:
objetivo:
segurado:
operadora_atual:
tipo_plano:
vidas:
regiao:
comissao:
status_apolice:
tom:
restricoes:
status:
proxima_task:
arquivos_relevantes:
```

Se esse arquivo existe, leia ele antes de qualquer historico. So abra arquivos antigos quando o context pack apontar gap.

Ver `00_OS/cache-policy.md` para TTL e compactacao.

## Loading em cascata

1. Ler task.
2. Ler context pack.
3. Ler gate.
4. Ler uma diretriz primaria.
5. Produzir.
6. Se falhar no gate, carregar diretriz secundaria ou subir modelo.

## Anti-patterns

- Carregar todos os agentes "para entender o sistema".
- Carregar toda a pasta de diretrizes antes de executar.
- Reabrir historico completo de lead/segurado em toda task.
- Usar modelo caro para triagem ou roteamento.
- Fazer output longo quando o handoff precisa ser curto.
- Carregar tabelas de todas as operadoras quando so precisa de uma.
- Carregar historico financeiro completo para responder duvida pontual.

## Handoff curto

Todo especialista termina com:

- output produzido;
- premissas usadas;
- gaps marcados;
- gate aplicado;
- proxima dependencia;
- arquivos gerados ou alterados.

Maximo 10 bullets.
