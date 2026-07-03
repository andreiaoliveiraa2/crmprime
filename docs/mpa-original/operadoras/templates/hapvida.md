# Hapvida

```yaml
operadora:
  nome: "Hapvida Assistencia Medica S.A."
  nome_fantasia: "Hapvida"
  registro_ans: "368253"
  cnpj: "63.554.067/0001-98"
  sede: "Fortaleza/CE"
  site: "https://www.hapvida.com.br"
  tipo: saude

  sobre: |
    Maior operadora de saude do Norte e Nordeste do Brasil. Apos fusao com 
    NotreDame Intermedica, tornou-se a maior operadora do pais em numero de 
    beneficiarios. Modelo vertical — possui hospitais, clinicas e laboratorios 
    proprios, o que permite preco mais competitivo.

  tipo_planos:
    - individual
    - familiar
    - PME
    - empresarial
    - adesao

  regioes_atendidas:
    - "Forte presenca em todo o Nordeste"
    - "Joao Pessoa/PB — presenca forte"
    - "Expansao nacional apos fusao com NotreDame Intermedica"
    - "Cobertura em capitais e grandes cidades do Brasil"

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

  rede_credenciada_joao_pessoa:
    hospitais:
      - "[A PREENCHER — verificar rede propria e credenciada atualizada no portal]"
    laboratorios:
      - "[A PREENCHER — Hapvida possui laboratorios proprios em JP]"
    clinicas:
      - "[A PREENCHER — verificar clinicas proprias e credenciadas]"
    urgencia_emergencia:
      - "[A PREENCHER — pronto-socorros proprios em JP]"
    observacao: "Hapvida opera majoritariamente com rede propria (hospitais, clinicas e labs proprios). Consultar portal para rede atualizada."

  comissao:
    percentual_inicial: "[A PREENCHER — confirmar com comercial Hapvida]"
    periodo_inicial: "[A PREENCHER]"
    percentual_vitalicio: "[A PREENCHER]"
    tipo: "[A PREENCHER — confirmar modelo de comissao]"
    prazo_pagamento: "[A PREENCHER]"
    dia_pagamento: "[A PREENCHER]"
    observacoes: "Confirmar regras de comissao diretamente com gerente comercial regional."

  prazos:
    cotacao: "[A PREENCHER]"
    analise_proposta: "[A PREENCHER]"
    implantacao: "[A PREENCHER]"
    carteirinha_fisica: "[A PREENCHER]"
    carteirinha_virtual: "Disponivel no app Hapvida apos ativacao"
    segunda_via: "[A PREENCHER]"

  documentos_necessarios:
    PF:
      - "RG ou documento com foto"
      - "CPF"
      - "Comprovante de residencia"
      - "Declaracao de saude"
    PJ:
      - "CNPJ"
      - "Contrato social ou ultima alteracao"
      - "Documentos dos beneficiarios"
    MEI:
      - "Certificado MEI (CCMEI)"
      - "CNPJ"
      - "Documentos pessoais do titular"
    dependentes:
      - "RG ou certidao de nascimento"
      - "CPF (se maior de 18)"
      - "Comprovante de vinculo"
      - "Declaracao de saude"

  portal_corretor:
    url: "[A PREENCHER — URL do portal do corretor Hapvida]"
    login: "[PROTEGIDO - usar .env]"
    app_corretor: "[A PREENCHER]"

  contato_comercial:
    nome: "[A PREENCHER — gerente comercial regional PB]"
    telefone: "[A PREENCHER]"
    email: "[A PREENCHER]"
    whatsapp: "[A PREENCHER]"

  sac:
    telefone: "0800 280 9130"
    horario: "[A PREENCHER]"

  diferenciais:
    - "Maior operadora do NE — forte presenca em Joao Pessoa"
    - "Modelo vertical (rede propria) — preco mais acessivel"
    - "Hospitais, clinicas e laboratorios proprios"
    - "Bom custo-beneficio para publico sensivel a preco"
    - "App do beneficiario com carteirinha virtual, agendamento e telemedicina"
    - "Forte em planos PME e empresariais"

  restricoes:
    - "Rede credenciada mais restrita (predominantemente propria) — menos opcoes de escolha"
    - "Reputacao de atendimento pode variar por regiao"
    - "Nao tem reembolso na maioria dos planos (rede propria/fechada)"
    - "Publico premium pode preferir operadoras com rede mais ampla"

  coparticipacao:
    disponivel: true
    descricao: "[A PREENCHER — verificar planos com e sem coparticipacao disponíveis]"

  acomodacao:
    - enfermaria
    - apartamento

  reajuste_anual:
    tipo: "Reajuste por faixa etaria (ANS) + reajuste anual definido pela operadora"
    indice: "[A PREENCHER — ultimo reajuste aplicado]"
    mes_referencia: "[A PREENCHER]"

  portabilidade:
    aceita: true
    regras: "Conforme regras da ANS — tempo minimo de permanencia e compatibilidade de plano"

  cpt:
    cobertura_parcial_temporaria: "24 meses para doencas preexistentes declaradas"
    regras: "Conforme legislacao ANS"

  app_beneficiario:
    nome: "Hapvida"
    funcionalidades:
      - "Carteirinha virtual"
      - "Agendamento de consultas"
      - "Telemedicina"
      - "Segunda via de boleto"
      - "Rede credenciada"
      - "Autorizacao de procedimentos"

  observacoes: |
    Hapvida e a principal opcao para leads sensíveis a preco em Joao Pessoa.
    Modelo vertical garante preco competitivo mas limita liberdade de escolha.
    Apos fusao com NotreDame Intermedica, ampliou cobertura nacional.
    Ideal para: PME, familias que buscam custo-beneficio, primeiro plano de saude.
    Menos indicada para: perfil premium que exige rede ampla e reembolso.
```
