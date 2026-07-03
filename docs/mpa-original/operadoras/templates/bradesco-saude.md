# Bradesco Saude

```yaml
operadora:
  nome: "Bradesco Saude S.A."
  nome_fantasia: "Bradesco Saude"
  registro_ans: "005711"
  cnpj: "92.693.118/0001-60"
  sede: "Rio de Janeiro/RJ (grupo Bradesco — sede em Osasco/SP)"
  site: "https://www.bradescosaude.com.br"
  tipo: saude

  sobre: |
    Uma das maiores operadoras de planos de saude do Brasil, pertencente ao 
    Grupo Bradesco Seguros. Posicionamento premium com rede ampla e opcao de 
    reembolso. Forte em planos empresariais e PME. Reconhecida pela qualidade 
    da rede credenciada e pelo atendimento.

  tipo_planos:
    - PME
    - empresarial
    - adesao

  nota_tipo_planos: |
    Bradesco Saude nao opera planos individuais/familiares desde 2016.
    Opcoes para PF sao via adesao (associacao de classe) ou PME (a partir de 2-3 vidas).

  regioes_atendidas:
    - "Cobertura nacional"
    - "Rede ampla em Joao Pessoa/PB"
    - "Forte presenca em todas as capitais"

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
    observacao: "PME e empresariais podem ter carencia reduzida ou isenta conforme numero de vidas e negociacao"

  rede_credenciada_joao_pessoa:
    hospitais:
      - "[A PREENCHER — verificar rede referenciada atualizada no portal]"
    laboratorios:
      - "[A PREENCHER — verificar no portal]"
    clinicas:
      - "[A PREENCHER — verificar no portal]"
    urgencia_emergencia:
      - "[A PREENCHER]"
    observacao: "Bradesco tem rede referenciada ampla. Verificar sempre no portal pois rede muda."

  comissao:
    percentual_inicial: "[A PREENCHER — confirmar com comercial Bradesco]"
    periodo_inicial: "[A PREENCHER]"
    percentual_vitalicio: "[A PREENCHER]"
    tipo: "[A PREENCHER]"
    prazo_pagamento: "[A PREENCHER]"
    dia_pagamento: "[A PREENCHER]"
    observacoes: "Confirmar regras de comissao com gerente comercial da regional."

  prazos:
    cotacao: "[A PREENCHER]"
    analise_proposta: "[A PREENCHER]"
    implantacao: "[A PREENCHER]"
    carteirinha_fisica: "[A PREENCHER]"
    carteirinha_virtual: "Disponivel no app Bradesco Saude"
    segunda_via: "[A PREENCHER]"

  documentos_necessarios:
    PF_adesao:
      - "RG ou documento com foto"
      - "CPF"
      - "Comprovante de residencia"
      - "Comprovante de vinculo com entidade de classe"
      - "Declaracao de saude"
    PJ:
      - "CNPJ"
      - "Contrato social ou ultima alteracao"
      - "Documentos dos beneficiarios"
      - "GFIP ou folha de pagamento (para empresariais)"
    MEI:
      - "Certificado MEI (CCMEI)"
      - "CNPJ"
      - "Documentos pessoais do titular"
    dependentes:
      - "RG ou certidao de nascimento"
      - "CPF"
      - "Comprovante de vinculo"
      - "Declaracao de saude"

  portal_corretor:
    url: "[A PREENCHER — portal do corretor Bradesco Seguros]"
    login: "[PROTEGIDO - usar .env]"
    app_corretor: "[A PREENCHER]"

  contato_comercial:
    nome: "[A PREENCHER — gerente comercial regional PB]"
    telefone: "[A PREENCHER]"
    email: "[A PREENCHER]"
    whatsapp: "[A PREENCHER]"

  sac:
    telefone: "0800 727 9966"
    horario: "[A PREENCHER]"

  diferenciais:
    - "Marca premium — credibilidade do grupo Bradesco"
    - "Rede credenciada ampla e de alta qualidade"
    - "Opcao de reembolso em planos superiores"
    - "Forte em planos empresariais e PME"
    - "Cobertura nacional"
    - "App completo para beneficiarios"
    - "Telemedicina incluida"

  restricoes:
    - "Nao tem plano individual/familiar direto — somente adesao ou PME"
    - "Preco mais alto que operadoras verticais (Hapvida, por exemplo)"
    - "Reembolso pode ter teto e regras que variam por plano"
    - "Processo de implantacao pode ser mais demorado em PME pequeno"

  coparticipacao:
    disponivel: true
    descricao: "[A PREENCHER — verificar planos com e sem coparticipacao]"

  acomodacao:
    - enfermaria
    - apartamento

  reajuste_anual:
    tipo: "Reajuste por faixa etaria (ANS) + reajuste anual negociado"
    indice: "[A PREENCHER — ultimo reajuste]"
    mes_referencia: "[A PREENCHER]"

  portabilidade:
    aceita: true
    regras: "Conforme regras da ANS"

  cpt:
    cobertura_parcial_temporaria: "24 meses para doencas preexistentes declaradas"
    regras: "Conforme legislacao ANS"

  app_beneficiario:
    nome: "Bradesco Saude"
    funcionalidades:
      - "Carteirinha virtual"
      - "Rede credenciada"
      - "Reembolso online"
      - "Telemedicina"
      - "Segunda via de boleto"
      - "Autorizacao de procedimentos"
      - "Extrato de utilizacao"

  observacoes: |
    Bradesco Saude e a opcao premium da corretora. Ideal para leads que 
    buscam rede ampla, reembolso e credibilidade. Preco mais alto justificado 
    pela qualidade. Nao tem plano individual — trabalhar via adesao ou PME.
    Ideal para: empresas, profissionais liberais (via adesao), perfil que valoriza qualidade.
    Menos indicada para: quem busca menor preco ou plano individual direto.
```
