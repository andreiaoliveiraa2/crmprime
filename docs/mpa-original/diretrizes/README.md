# Diretrizes

Esta pasta guarda conhecimento em formato de principio, nao template. Cada arquivo e uma camada de inteligencia que o Comando MPA consulta para tomar decisoes e produzir entregas com profundidade real.

## Arquivos

| Arquivo | Conteudo | Quando carregar |
|---|---|---|
| `seguros-saude-diretrizes.md` | Conhecimento profundo do mercado de saude suplementar brasileiro: ANS, tipos de plano, carencias, portabilidade, faixas etarias, operadoras, ciclo de venda, comissoes, regulacao | Sempre que a task envolver cotacao, proposta, qualificacao, comparativo, argumentacao de venda, onboarding ou qualquer decisao que dependa de regras do setor |
| `copy-corretora.md` | Fundamentos de linguagem persuasiva adaptados para corretora de saude: tom, argumentos, objecoes, adaptacao por canal | Sempre que a task envolver criacao de mensagem, script, post, email, argumento de venda ou resposta a objecao |
| `whatsapp-diretrizes.md` | Regras de conversa por WhatsApp para corretora: prospecção, qualificacao, cotacao, follow-up, onboarding, retencao, handoff humano | Sempre que a task envolver mensagem de WhatsApp, fluxo de conversa ou automacao de atendimento |
| `pesquisa-voc.md` | Voz do cliente de plano de saude: dores literais, desejos reais, objecoes comuns, linguagem que o segurado usa | Sempre que a task envolver criacao de copy, conteudo, argumento ou pesquisa de publico |
| `voz-ptbr.md` | Voz humana em portugues brasileiro adaptada para corretora de saude em Joao Pessoa/PB | Sempre que a task envolver qualquer producao de texto final para cliente, lead ou rede social |
| `nicho/corretora-saude.md` | Mapa profundo do nicho: dores da corretora, desejos, objecoes, ciclo de venda, riscos regulatorios | Quando a task envolver estrategia do negocio, posicionamento, argumentacao sobre o uso do MPA ou planejamento de operacao |

## Regra

Carregar uma diretriz por task. Se precisar de outra, justifique no handoff.

## Hierarquia de consulta

1. `seguros-saude-diretrizes.md` e a base — todas as outras diretrizes dependem dele
2. `pesquisa-voc.md` alimenta `copy-corretora.md` e `voz-ptbr.md`
3. `whatsapp-diretrizes.md` depende de `copy-corretora.md` para tom e de `seguros-saude-diretrizes.md` para regras
4. `nicho/corretora-saude.md` e meta — fala sobre a corretora como negocio, nao sobre o segurado

## O que NAO esta aqui

- Templates prontos (estao em `10_TEMPLATES/`)
- Fluxos de WhatsApp (estao em `11_WHATSAPP_STACK/`)
- Dados de operadoras (estao em `14_OPERADORAS/`)
- Prompts validados (estao em `15_PRODUCT_RELEASE/`)
