# Regras de Comissão — Como o MPA Calcula
> Baseado no sistema de cálculo real (CRM da corretora). Cada operadora tem sua regra. A MPA pergunta isso na configuração e usa para calcular comissões corretamente — inicial (parcelas) e vitalício.

## Como a comissão funciona

A comissão tem duas partes possíveis:

### 1. Comissão inicial (parcelas)
- Calculada sobre o valor do plano × % total
- Dividida em N parcelas (de 1 a 24)
- Cada parcela tem um split: % empresa + % vendedor (deve somar 100%)

**Exemplo:** plano R$ 500, % total 100%, 12 parcelas, split 50/50
→ Comissão de R$ 500 dividida, metade empresa, metade vendedor

### 2. Comissão vitalícia (recorrente)
- Só se a operadora/corretor TEM vitalício
- Valor = valor do plano × % vitalício
- Recorrente (todo mês enquanto o cliente fica)
- Também dividida no split empresa/vendedor

**Exemplo:** plano R$ 500, % vitalício 2%
→ R$ 10/mês recorrente, dividido no split

## Campos de cada regra (por operadora)

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| Operadora | Nome | Amil |
| % Total | Comissão inicial total | 100% |
| Nº parcelas | Em quantas vezes vem (1-24) | 12 |
| Split por parcela | % empresa / % vendedor | 50% / 50% |
| Tem vitalício? | Sim ou não | Sim |
| % Vitalício | Percentual recorrente | 2% |
| Desconta imposto? | Sim ou não | Não |
| % Imposto | Se desconta, quanto | — |

## Tabela de regras (a corretora preenche por operadora)

| Operadora | % Total | Parcelas | Split (emp/vend) | Vitalício? | % Vital. | Imposto |
|-----------|---------|----------|------------------|-----------|----------|---------|
| [Amil] | [100%] | [12] | [50/50] | [sim] | [2%] | [não] |
| | | | | | | |

## Como a MPA usa

Quando a corretora registra uma venda:
```
"vendi um plano da Amil de R$ 500 pro João"
   ↓
MPA pega a regra da Amil (% total, parcelas, vitalício)
   ↓
Calcula: comissão inicial em X parcelas + vitalício mensal
   ↓
Registra no financeiro e mostra no dashboard
```

## Para corretores SEM split (não têm vendedor/subcorretor)

Se o corretor trabalha sozinho (sem repassar para vendedores):
- O split é 100% dele
- Não precisa separar empresa/vendedor
- A MPA simplifica: toda comissão é dele
