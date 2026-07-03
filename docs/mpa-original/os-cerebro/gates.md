# Quality Gates MPA

Gates existem para impedir retrabalho caro e proteger a corretora de erros que custam comissao, reputacao ou conformidade regulatoria. Cada gate deve devolver problemas especificos e correcoes concretas.

Use `00_OS/gate-matrix.md` para severidade, score, verdict e escalada.

## Contrato de resposta

```yaml
verdict: pass | concerns | fail
score: 0-10
specific_issues:
concrete_fixes:
blocked_next_step: true | false
severity: S0 | S1 | S2 | S3 | S4
```

## GATE-INTAKE

Passa quando:

- objetivo esta claro;
- output esperado esta nomeado;
- premissas estao registradas;
- proxima etapa tem owner;
- se envolve lead real, perfil minimo esta presente (nome, tipo PF/PJ, regiao).

## GATE-COTACAO

Passa quando:

- lead tem dados minimos: nome, faixa etaria, regiao, tipo (PF/PJ/PME), numero de vidas;
- operadoras selecionadas atuam na regiao do lead;
- faixa etaria esta correta e compativel com tabela de precos;
- tipo de plano esta definido (ambulatorial, hospitalar, completo, odontologico);
- nenhum valor foi inventado — todos vem de tabela ou portal da operadora;
- se PJ/PME, ha CNPJ ou indicacao de que sera coletado;
- coparticipacao e acomodacao estao especificadas;
- carencias e prazos estao mencionados conforme regra da operadora;
- existe `[A PREENCHER]` para dados ainda nao confirmados em vez de valores inventados.

## GATE-PROPOSTA

Passa quando:

- todas as coberturas listadas foram confirmadas com a operadora;
- nenhuma cobertura foi prometida sem confirmacao;
- valores estao atualizados e com fonte (tabela, portal, cotacao formal);
- carencias, CPT e regras de portabilidade estao corretas;
- rede credenciada mencionada existe na regiao do lead;
- proposta nao foi enviada sem aprovacao da corretora;
- dados do segurado estao completos (nome, CPF, data nascimento, se aplicavel);
- condicoes comerciais (desconto, isencao de carencia) tem respaldo da operadora.

## GATE-CONTEUDO

Passa quando:

- conteudo nao promete cobertura medica especifica;
- linguagem regulatoria esta adequada (nao faz propaganda enganosa de plano);
- nao menciona valores de plano em conteudo publico (valores mudam por faixa/regiao);
- conteudo educativo sobre saude suplementar e correto e atual;
- nao viola diretrizes da ANS sobre publicidade de planos;
- tom e profissional e acolhedor — condizente com a corretora;
- se menciona operadora, informacao e verificavel;
- CTA e claro e direciona para contato, nao para compra direta.

## GATE-FOLLOW-UP

Passa quando:

- follow-up tem um motivo novo e relevante (nao e so "checando se viu minha mensagem");
- nao usa pressao artificial ou urgencia falsa ("ultimas vagas", "preco sobe amanha" sem ser verdade);
- respeita intervalo minimo desde o ultimo contato;
- traz informacao util ao lead (novidade da operadora, mudanca de tabela, conteudo educativo);
- tom e respeitoso e nao insistente;
- existe opcao de opt-out implicita ou explicita;
- se lead ja disse nao, follow-up nao ignora a recusa.

## GATE-WHATSAPP

Passa quando:

- objetivo da conversa esta claro;
- oferta, publico e restricoes foram considerados;
- mensagens sao curtas e naturais no celular;
- existe regra de handoff humano (quando transferir pra corretora);
- existem stop rules e opt-out quando aplicavel;
- bot nao finge ser humano — se identifica como assistente;
- nao ha promessa de cobertura, preco, carencia ou desconto inventado;
- fluxo esta em modo `draft` ate ativacao real;
- disparo real ou automacao ativa exige confirmacao da corretora.

## GATE-AUTOMATION

Passa quando:

- objetivo e trigger do processo estao claros;
- entradas, saidas e responsaveis foram nomeados;
- etapas manuais, assistidas, automaticas e bloqueadas foram separadas;
- ferramentas, acessos e dados necessarios estao listados;
- existe handoff humano em pontos criticos;
- existe plano de teste antes de ativar;
- existe rollback;
- tudo esta em modo `draft` ate confirmacao;
- nenhum envio, API write, CRM update, publicacao ou acao irreversivel roda sem confirmacao da corretora.

## GATE-DELIVERY

Passa quando:

- entregaveis prometidos existem;
- handoff final tem proximos passos;
- gaps estao marcados como `[A PREENCHER]` ou bloqueios;
- ledger esta atualizado;
- se envolve lead real, dados estao protegidos e nao expostos em logs publicos.
