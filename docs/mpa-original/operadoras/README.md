# 14_OPERADORAS — Stack de Gestao de Operadoras

Stack operacional para gerenciar o relacionamento com as 7 operadoras de planos de saude que a corretora trabalha. Centraliza dados, prazos, comissoes, documentacao e particularidades de cada operadora.

Cada operadora tem regras diferentes: prazo de implantacao, documentos exigidos, comissao, rede credenciada, reajuste. A corretora precisa saber de cor dezenas de detalhes — ou ter um sistema que sabe por ela. O MPA trata operadoras como base de conhecimento viva.

## Objetivo

Gerenciar e disponibilizar:

1. dados completos de cada operadora;
2. tipos de plano e coberturas;
3. rede credenciada na regiao;
4. regras de comissao e prazos de pagamento;
5. documentos necessarios por tipo de contratacao;
6. prazos de cotacao, implantacao e carteirinha;
7. rastreamento de comissoes;
8. gestao de documentos de propostas e apolices.

## Operadoras ativas

| Operadora | Tipo | Foco |
|---|---|---|
| Hapvida | Saude | Maior do NE, modelo vertical, preco competitivo |
| Bradesco Saude | Saude | Premium, rede ampla, reembolso |
| SulAmerica | Saude | Premium/intermediario, marca forte |
| Amil | Saude | Grande rede, multiplas faixas, grupo UnitedHealth |
| [operadora dental] | Odontologico | Regional, foco em odontologia |
| [operadora regional] | Saude | Regional, competitiva na PB |
| [operadora regional] | Saude | Regional |

## Arquitetura

```text
CoS
  -> operadora-controller
      -> commission-tracker
      -> document-manager
```

## Agentes

| Agente | Responsabilidade |
|---|---|
| `@operadora-controller` | Agente principal. Gerencia dados, planos, coberturas, disponibilidade regional |
| `@commission-tracker` | Rastreia comissoes: previsto vs recebido, atrasos, disputas |
| `@document-manager` | Gerencia documentos: propostas, declaracoes de saude, apolices, copias |

## Templates

| Template | Uso |
|---|---|
| `operadora-template.md` | Template base (estrutura padrao para qualquer operadora) |
| `hapvida.md` | Dados da Hapvida |
| `bradesco-saude.md` | Dados da Bradesco Saude |
| `sulamerica.md` | Dados da SulAmerica |
| `amil.md` | Dados da Amil |
| `dental-center.md` | Dados da [operadora dental] |
| `previmed.md` | Dados da [operadora regional] |
| `maxmed.md` | Dados da [operadora regional] |

## Comandos operacionais

| Pedido | Rota |
|---|---|
| dados da operadora X, regras da operadora | `@operadora-controller` |
| comissao nao entrou, quanto vou receber | `@commission-tracker` |
| documentos para proposta, checklist de docs | `@document-manager` |
| prazo da operadora, status de proposta | `@operadora-controller` |
| comparar operadoras | `@operadora-controller` |

## Regras inegociaveis

- Nunca inventar dados de operadora (precos, rede, comissao).
- Dados nao confirmados devem ser marcados como `[A PREENCHER]`.
- Rede credenciada muda — sempre verificar no portal da operadora antes de prometer.
- Comissao e percentual sao confidenciais — nao expor em conteudo publico.
- Login e senha de portais nunca ficam em arquivos — usar referencia `[PROTEGIDO - usar .env]`.
- Informacoes regulatorias (ANS, carencias) devem seguir a legislacao vigente.

## Como encaixa no MPA

- Agente Comercial consulta operadoras para montar cotacao.
- Agente Atendimento consulta para responder duvidas de segurados.
- Agente Financeiro consulta comissoes.
- Agente Pos-Venda consulta prazos e carteirinha.
- Email Stack usa dados para montar emails de cotacao e proposta.

## Saidas padrao

```text
14_OPERADORAS/
├── README.md
├── agents/
│   ├── operadora-controller.md
│   ├── commission-tracker.md
│   └── document-manager.md
└── templates/
    ├── operadora-template.md
    ├── hapvida.md
    ├── bradesco-saude.md
    ├── sulamerica.md
    ├── amil.md
    ├── dental-center.md
    ├── previmed.md
    └── maxmed.md
```
