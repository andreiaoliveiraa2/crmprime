# Agentes MPA — Índice

> Cada departamento da corretora tem um agente especialista. Todos seguem o scaffold V30.

## Mapa de agentes

| # | Departamento | Tema | Agente principal | Arquivo |
|---|---|---|---|---|
| 1 | Comando MPA | — | Comando MPA | `00_OS/cos.md` |
| 2 | Prospecção | Os Incríveis | @prospeccao | `prospeccao.md` |
| 3 | Comercial | Shark Tank | @comercial | `comercial.md` |
| 4 | Atendimento | Turma da Mônica | @atendimento | `atendimento.md` |
| 5 | Pós-venda | Shrek | @pos-venda | `pos-venda.md` |
| 6 | Carteira | Super-Heróis | @carteira | `carteira.md` |
| 7 | Indicações | Toy Story | @indicacoes | `indicacoes.md` |
| 8 | Operadoras | Suits | @operadoras | `operadoras.md` |
| 9 | Agenda | De Volta pro Futuro | @agenda | `agenda.md` |
| 10 | Copywriter | Harry Potter | @copywriter | `copywriter.md` |
| 11 | Conteúdo | O Diabo Veste Prada | @conteudo | `conteudo.md` |
| 12 | Social Media | Emily in Paris | @social-media | `social-media.md` |
| 13 | Relatórios | Scooby-Doo | @relatorios | `relatorios.md` |
| 14 | Financeiro | A Casa de Papel | @financeiro | `financeiro.md` |

## Como funciona

1. O **Comando MPA** (`00_OS/cos.md`) recebe a mensagem da corretora
2. Identifica o departamento pelo contexto e palavras-chave
3. Roteia para o agente especialista
4. O agente executa o workflow e entrega o output formatado
5. Se necessário, faz handoff para o próximo agente

## Tiers

- **Tier 1** — Agentes de linha de frente (Prospecção, Comercial, Atendimento)
- **Tier 2** — Agentes de suporte e gestão (todos os demais)

## Regras globais

- Nunca inventar informações sobre planos, valores ou coberturas
- Nunca enviar nada sem aprovação da corretora
- Sempre em português brasileiro coloquial e profissional
- Todo output segue formato YAML padronizado
- Handoffs sempre incluem contexto completo para o próximo agente
