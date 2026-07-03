# [operadora regional]

```yaml
operadora:
  nome: "[A PREENCHER — razao social completa]"
  nome_fantasia: "[operadora regional]"
  registro_ans: "[A PREENCHER — verificar registro ANS]"
  cnpj: "[A PREENCHER]"
  sede: "[A PREENCHER]"
  site: "[A PREENCHER]"
  tipo: saude

  sobre: |
    Operadora regional de planos de saude. Como operadora local/regional, 
    pode oferecer opcoes competitivas para o mercado onde atua. Complementa 
    a carteira da corretora oferecendo mais uma alternativa para leads que 
    buscam opcoes regionais.

  tipo_planos:
    - "[A PREENCHER — verificar modalidades: individual, familiar, PME, empresarial]"

  regioes_atendidas:
    - "[A PREENCHER — verificar area de atuacao]"

  faixas_etarias_ans:
    - faixa: "0 a 18 anos"
    - faixa: "19 a 23 anos"
    - faixa: "24 a 28 anos"
    - faixa: "29 a 33 anos"
    - faixa: "34 a 38 anos"
    - faixa: "39 a 43 anos"
    - faixa: "44 a 48 anos"
    - faixa: "49 a 53 anos"
    - faixa: "54 a 58 anos"
    - faixa: "59 anos ou mais"

  carencias_padrao:
    urgencia_emergencia: "24 horas"
    consultas_exames_simples: "30 dias"
    demais_procedimentos: "180 dias"
    parto: "300 dias"
    doencas_preexistentes_cpt: "24 meses"
    observacao: "[A PREENCHER — verificar se ha regras especificas]"

  rede_credenciada_joao_pessoa:
    hospitais:
      - "[A PREENCHER — verificar rede em JP]"
    laboratorios:
      - "[A PREENCHER]"
    clinicas:
      - "[A PREENCHER]"
    urgencia_emergencia:
      - "[A PREENCHER]"
    observacao: "Verificar rede credenciada atualizada diretamente com a operadora."

  comissao:
    percentual_inicial: "[A PREENCHER]"
    periodo_inicial: "[A PREENCHER]"
    percentual_vitalicio: "[A PREENCHER]"
    tipo: "[A PREENCHER]"
    prazo_pagamento: "[A PREENCHER]"
    dia_pagamento: "[A PREENCHER]"
    observacoes: "Confirmar regras de comissao diretamente com a operadora."

  prazos:
    cotacao: "[A PREENCHER]"
    analise_proposta: "[A PREENCHER]"
    implantacao: "[A PREENCHER]"
    carteirinha_fisica: "[A PREENCHER]"
    carteirinha_virtual: "[A PREENCHER]"
    segunda_via: "[A PREENCHER]"

  documentos_necessarios:
    PF:
      - "RG ou documento com foto"
      - "CPF"
      - "Comprovante de residencia"
      - "Declaracao de saude"
      - "[A PREENCHER — verificar documentos adicionais]"
    PJ:
      - "CNPJ"
      - "Contrato social"
      - "Documentos dos beneficiarios"
      - "[A PREENCHER]"
    dependentes:
      - "RG ou certidao de nascimento"
      - "CPF"
      - "Comprovante de vinculo"
      - "Declaracao de saude"

  portal_corretor:
    url: "[A PREENCHER]"
    login: "[PROTEGIDO - usar .env]"

  contato_comercial:
    nome: "[A PREENCHER]"
    telefone: "[A PREENCHER]"
    email: "[A PREENCHER]"
    whatsapp: "[A PREENCHER]"

  sac:
    telefone: "[A PREENCHER]"
    horario: "[A PREENCHER]"

  diferenciais:
    - "[A PREENCHER — diferenciais especificos da [operadora regional]]"

  restricoes:
    - "Atuacao regional — verificar area de cobertura"
    - "[A PREENCHER — restricoes especificas]"

  coparticipacao:
    disponivel: "[A PREENCHER]"
    descricao: "[A PREENCHER]"

  acomodacao:
    - "[A PREENCHER]"

  reajuste_anual:
    tipo: "[A PREENCHER]"
    indice: "[A PREENCHER]"
    mes_referencia: "[A PREENCHER]"

  portabilidade:
    aceita: "[A PREENCHER]"
    regras: "[A PREENCHER]"

  cpt:
    cobertura_parcial_temporaria: "24 meses"
    regras: "Conforme legislacao ANS"

  app_beneficiario:
    nome: "[A PREENCHER — verificar se tem app]"
    funcionalidades: "[A PREENCHER]"

  observacoes: |
    [operadora regional] e opcao regional na carteira da corretora. 
    IMPORTANTE: este template precisa ser preenchido integralmente com dados 
    reais da operadora — consultar portal do corretor ou contato comercial.
    A maioria dos campos esta como [A PREENCHER] porque dados especificos 
    da [operadora regional] precisam ser confirmados diretamente.
```
