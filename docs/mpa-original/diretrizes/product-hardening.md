# Product Hardening — Blindagem da Operacao da Corretora

> Diretrizes para enrijecer a operacao da corretora contra erros, retrabalho e riscos regulatorios. Hardening nao e burocracia — e protecao contra falhas que custam comissao, reputacao e conformidade.

---

## Principio central

Cada camada do MPA que interage com leads reais, segurados, operadoras ou dados sensiveis precisa ser testada, validada e monitorada. O custo de um erro na corretora e direto: comissao perdida, lead que nao fecha, segurado que cancela, reclamacao na ANS, processo por promessa indevida.

Hardening e o que separa "funciona no papel" de "funciona na pratica".

---

## Camadas de hardening

### Camada 1 — Claims (promessas)

Toda afirmacao que o MPA produz sobre plano de saude precisa ser verificavel.

| Tipo de claim | Verificacao obrigatoria |
|---|---|
| Valor de plano | Veio de tabela vigente da operadora? Data da tabela registrada? |
| Cobertura | Consta no contrato do plano especifico? Confirmada com a operadora? |
| Carencia | Conforme RN 162 da ANS? Operadora oferece carencia menor? Registrado? |
| Rede credenciada | Hospital/clinica esta credenciado na regiao do lead? Verificado recentemente? |
| Reajuste | Percentual e fonte estao corretos? Plano individual (ANS) vs. coletivo (operadora)? |
| Portabilidade | Requisitos da RN 438 foram verificados? Lead atende todos os criterios? |
| Isencao de carencia | Operadora autorizou? Quantidade de vidas justifica? Documentado? |
| Comissao | Politica vigente da operadora? Modelo (vitalicia/producao/agenciamento) confirmado? |
| Depoimento | Autorizacao do cliente (LGPD)? Depoimento real, nao fabricado? |
| Comparacao de operadoras | Dados sao da mesma data-base? Comparacao justa (mesmo tipo de plano)? |

### Regra de ouro

Se um claim nao pode ser verificado neste momento, ele deve aparecer como `[A CONFIRMAR COM A OPERADORA]` em vez de ser apresentado como fato.

---

### Camada 2 — Dados sensiveis

A corretora lida com dados de saude, que sao dados sensiveis pela LGPD.

| Dado | Classificacao | Regra |
|---|---|---|
| Nome, telefone, email | Pessoal | Armazenar com cuidado, nao expor em logs publicos |
| CPF, RG | Pessoal sensivel | Nunca em chat aberto, nunca em log, nunca em conteudo |
| Historico medico | Sensivel (saude) | Nunca compartilhar, nunca registrar em local acessivel |
| Declaracao de saude | Sensivel (saude) | Tratar como documento confidencial |
| Dados de dependentes | Pessoal + sensivel | Mesmo tratamento do titular |
| Valor de comissao | Comercial | Nao expor para lead ou segurado |
| CNPJ | Empresarial | Proteger, mas nao e sensivel pela LGPD |

### Regras de dados

1. Nunca mencionar CPF, historico medico ou dados de saude em outputs que o MPA gera automaticamente
2. Se o lead fornece dado sensivel em conversa, registrar apenas em `current-context.md` do projeto, nunca em logs publicos
3. Dados de segurado nao transitam entre automacoes sem necessidade
4. Se o MPA gerar rascunho que contenha dado sensivel, o rascunho deve ser marcado como `[DADO SENSIVEL — REVISAR]`
5. Proposta com CPF e dados de saude so existe como arquivo do projeto, nunca em historico de conversa

---

### Camada 3 — Gates de qualidade

Cada gate do MPA (ver `00_OS/gates.md`) e uma barreira de hardening. Gates nao sao opcionais.

| Gate | O que protege |
|---|---|
| GATE-INTAKE | Impede task mal definida de consumir recursos |
| GATE-COTACAO | Impede cotacao com dados errados ou incompletos |
| GATE-PROPOSTA | Impede proposta com promessa nao confirmada |
| GATE-CONTEUDO | Impede publicacao com claim regulatorio incorreto |
| GATE-WHATSAPP | Impede bot mal configurado de interagir com lead |
| GATE-AUTOMATION | Impede automacao de rodar sem teste |
| GATE-DELIVERY | Impede entrega incompleta ou com gaps criticos |
| GATE-FOLLOW-UP | Impede follow-up com pressao indevida ou sem motivo |

### Severidade de falha

| Severidade | Descricao | Acao |
|---|---|---|
| S0 — Critico | Promessa falsa de cobertura, dado de saude exposto, valor inventado | Parar tudo. Corrigir imediatamente. Notificar corretora |
| S1 — Alto | Cotacao com faixa etaria errada, rede credenciada incorreta, carencia errada | Nao enviar. Corrigir antes de prosseguir |
| S2 — Medio | Formato inadequado, tom robotico, CTA ausente | Corrigir antes de enviar, mas nao bloqueia |
| S3 — Baixo | Formatacao visual, typo, detalhe estetico | Corrigir se possivel, nao bloqueia |
| S4 — Info | Sugestao de melhoria, otimizacao | Registrar para proxima iteracao |

---

### Camada 4 — Testes de stress

Antes de ativar qualquer fluxo, automacao ou bot para uso real:

#### Teste de caminho feliz

- Lead fornece todos os dados corretamente
- Lead aceita a cotacao
- Lead assina a proposta
- Verificar: todos os passos funcionam do inicio ao fim

#### Teste de caminho triste

- Lead nao fornece dados obrigatorios
- Lead pergunta algo fora do escopo do bot
- Lead reclama
- Lead pede para falar com humano
- Verificar: handoff funciona, bot nao trava, nenhuma mensagem inadequada

#### Teste de edge case

- Lead com 59 anos (ultima faixa etaria — preco muda significativamente)
- Lead PJ com 2 vidas (PME minimo)
- Lead PJ com 30 vidas (muda de PME para empresarial)
- Lead com doenca preexistente (CPT)
- Lead pedindo portabilidade (verificar requisitos)
- Lead menor de idade (precisa do responsavel)
- Lead de regiao onde operadora nao atua
- Lead que ja e cliente querendo adicionar dependente

#### Teste de compliance

- Verificar que nenhum output promete cobertura nao confirmada
- Verificar que nenhum valor foi inventado
- Verificar que dados sensiveis nao estao expostos
- Verificar que bot se identifica como assistente, nao finge ser humano
- Verificar que existe opt-out

---

### Camada 5 — Monitoramento continuo

Mesmo apos ativacao, manter vigilancia:

| Quando | O que verificar |
|---|---|
| Diario | Alguma automacao falhou? Algum lead reclamou? |
| Semanal | Taxa de resposta esta dentro do esperado? Handoffs estao funcionando? |
| Mensal | Tabelas de operadoras foram atualizadas? Scripts ainda fazem sentido? |
| Por evento | Operadora mudou tabela, rede, produto -> atualizar tudo que referencia |

---

## Hardening por area

### Cotacao

- [ ] Valores vem de tabela vigente com data registrada
- [ ] Faixa etaria ANS aplicada corretamente (10 faixas)
- [ ] Coparticipacao especificada
- [ ] Acomodacao especificada
- [ ] Operadora atua na regiao do lead
- [ ] Comparativo tem pelo menos 2 opcoes
- [ ] Recomendacao da corretora tem justificativa

### Proposta

- [ ] Coberturas confirmadas com a operadora
- [ ] Carencias corretas por operadora e tipo de plano
- [ ] CPT/agravo mencionado se aplicavel
- [ ] Documentos necessarios listados
- [ ] Prazo de validade da proposta
- [ ] Nenhuma promessa que depende de confirmacao da operadora sem aviso

### WhatsApp

- [ ] Bot se identifica como assistente
- [ ] Nenhuma promessa de cobertura, valor ou carencia
- [ ] Handoff humano funciona nos pontos criticos
- [ ] Stop conditions implementadas (lead pediu para parar)
- [ ] Mensagens curtas e naturais no celular
- [ ] Fluxo em modo `draft` ate aprovacao

### Conteudo

- [ ] Nenhum valor de plano em post publico
- [ ] Nenhuma promessa de cobertura especifica
- [ ] Informacao regulatoria correta (ANS, RN)
- [ ] Tom adequado — educativo, nao panfleto
- [ ] CTA direciona para contato, nao para compra direta

### Automacao

- [ ] Trigger definido e testado
- [ ] Rollback documentado
- [ ] Handoff humano em pontos criticos
- [ ] Dados sensiveis nao transitam desnecessariamente
- [ ] Modo draft antes de ativacao
- [ ] Revisao mensal agendada

---

## Processo de hardening

```
1. Criar artefato (cotacao, proposta, bot, conteudo, automacao)
   |
2. Passar pelo gate correspondente
   |
3. Se falhou -> corrigir -> voltar ao passo 2
   |
4. Se passou -> rodar teste de caminho feliz
   |
5. Rodar teste de caminho triste
   |
6. Rodar teste de edge case
   |
7. Rodar teste de compliance
   |
8. Corretora revisa e aprova
   |
9. Ativar em modo limitado (1 lead de teste)
   |
10. Monitorar por 48h
   |
11. Se ok -> ativar para operacao
   |
12. Monitoramento continuo
```

---

## Registro de incidentes

Se acontecer qualquer problema em operacao:

```yaml
incidente:
  data:
  descricao:
  severidade: S0 | S1 | S2 | S3 | S4
  impacto: "Quem foi afetado"
  causa_raiz: "O que causou"
  correcao: "O que foi feito"
  prevencao: "O que muda para nao repetir"
  responsavel:
  status: resolvido | em_andamento | monitorando
```

Registrar em `07_LOGS/decisions.md`.

---

## Regras inegociaveis de hardening

1. Nenhum claim sobre cobertura, valor, carencia ou rede vai para o lead sem verificacao
2. Nenhuma automacao vai para producao sem teste
3. Nenhum dado sensivel transita sem necessidade
4. Nenhum gate e opcional — se existe, e obrigatorio
5. Se deu errado, registrar, corrigir e prevenir — nao fingir que nao aconteceu
6. Hardening nao e uma fase — e continuo. Cada atualizacao de tabela, cada nova operadora, cada mudanca de regulacao exige revalidacao
