# Amil

```yaml
operadora:
  nome: "Amil Assistencia Medica Internacional S.A."
  nome_fantasia: "Amil"
  registro_ans: "326305"
  cnpj: "29.309.127/0001-79"
  sede: "Rio de Janeiro/RJ"
  site: "https://www.amil.com.br"
  tipo: saude

  sobre: |
    Uma das maiores operadoras de saude do Brasil, pertencente ao grupo 
    UnitedHealth (maior empresa de saude do mundo). Opera com diversas 
    faixas de plano (do basico ao premium) e tem rede credenciada ampla. 
    Conhecida pela variedade de produtos e cobertura nacional.

  tipo_planos:
    - individual
    - familiar
    - PME
    - empresarial

  nota_tipo_planos: |
    Amil e uma das poucas grandes operadoras que ainda oferece planos 
    individuais/familiares em algumas regioes. Verificar disponibilidade 
    para Joao Pessoa/PB.

  regioes_atendidas:
    - "Cobertura nacional"
    - "Presenca em Joao Pessoa/PB — [A PREENCHER — verificar nivel de rede na regiao]"
    - "Forte em Rio de Janeiro, Sao Paulo e grandes centros"

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
      - "[A PREENCHER — verificar rede em JP, pode ser mais limitada que em grandes centros]"
    laboratorios:
      - "[A PREENCHER]"
    clinicas:
      - "[A PREENCHER]"
    urgencia_emergencia:
      - "[A PREENCHER]"
    observacao: "Rede da Amil em Joao Pessoa pode ser menor que em RJ/SP. Verificar no portal antes de prometer."

  comissao:
    percentual_inicial: "[A PREENCHER — confirmar com comercial Amil]"
    periodo_inicial: "[A PREENCHER]"
    percentual_vitalicio: "[A PREENCHER]"
    tipo: "[A PREENCHER]"
    prazo_pagamento: "[A PREENCHER]"
    dia_pagamento: "[A PREENCHER]"
    observacoes: "Confirmar com gerente comercial regional."

  prazos:
    cotacao: "[A PREENCHER]"
    analise_proposta: "[A PREENCHER]"
    implantacao: "[A PREENCHER]"
    carteirinha_fisica: "[A PREENCHER]"
    carteirinha_virtual: "Disponivel no app Amil"
    segunda_via: "[A PREENCHER]"

  documentos_necessarios:
    PF:
      - "RG ou documento com foto"
      - "CPF"
      - "Comprovante de residencia"
      - "Declaracao de saude"
    PJ:
      - "CNPJ"
      - "Contrato social"
      - "Documentos dos beneficiarios"
      - "[A PREENCHER — verificar exigencias especificas da Amil]"
    MEI:
      - "Certificado MEI (CCMEI)"
      - "CNPJ"
      - "Documentos pessoais"
    dependentes:
      - "RG ou certidao de nascimento"
      - "CPF"
      - "Comprovante de vinculo"
      - "Declaracao de saude"

  portal_corretor:
    url: "[A PREENCHER — portal do corretor Amil]"
    login: "[PROTEGIDO - usar .env]"
    app_corretor: "[A PREENCHER]"

  contato_comercial:
    nome: "[A PREENCHER — gerente comercial regional PB]"
    telefone: "[A PREENCHER]"
    email: "[A PREENCHER]"
    whatsapp: "[A PREENCHER]"

  sac:
    telefone: "0800 730 0202"
    horario: "[A PREENCHER]"

  diferenciais:
    - "Grupo UnitedHealth — respaldo financeiro internacional"
    - "Variedade de planos (do basico ao premium)"
    - "Uma das poucas que ainda oferece plano individual em algumas regioes"
    - "Rede credenciada ampla nacionalmente"
    - "Cobertura nacional"
    - "Multiplas faixas de preco para diferentes perfis"
    - "Telemedicina incluida"

  restricoes:
    - "Rede em Joao Pessoa pode ser limitada comparada a grandes centros"
    - "Historico de reajustes acima da media em planos individuais"
    - "Processos internos podem ser mais burocraticos"
    - "[A PREENCHER — verificar restricoes regionais para PB]"

  coparticipacao:
    disponivel: true
    descricao: "[A PREENCHER — verificar planos com e sem coparticipacao]"

  acomodacao:
    - enfermaria
    - apartamento

  reajuste_anual:
    tipo: "Reajuste por faixa etaria (ANS) + reajuste anual"
    indice: "[A PREENCHER]"
    mes_referencia: "[A PREENCHER]"
    observacao: "Amil tem historico de reajustes acima da media em planos individuais — acompanhar"

  portabilidade:
    aceita: true
    regras: "Conforme regras da ANS"

  cpt:
    cobertura_parcial_temporaria: "24 meses"
    regras: "Conforme legislacao ANS"

  app_beneficiario:
    nome: "Amil Clientes"
    funcionalidades:
      - "Carteirinha virtual"
      - "Rede credenciada"
      - "Agendamento de consultas"
      - "Telemedicina"
      - "Segunda via de boleto"
      - "Autorizacoes"

  observacoes: |
    Amil e opcao versatil por ter planos em diversas faixas de preco.
    Ponto de atencao: verificar rede em Joao Pessoa antes de oferecer — 
    pode ser mais limitada que Hapvida (regional forte) ou Bradesco (rede ampla).
    Vantagem competitiva: pode ser uma das poucas opcoes para plano individual.
    Ideal para: leads que querem marca grande, plano individual, ou empresa com varias faixas.
    Menos indicada para: quem precisa de rede forte especificamente em JP (verificar primeiro).
```
