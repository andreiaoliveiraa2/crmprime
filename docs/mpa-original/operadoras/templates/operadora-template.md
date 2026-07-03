# Template Base: Operadora

Use este template como base para criar o perfil de qualquer operadora. Copie, preencha com dados reais e marque `[A PREENCHER]` onde nao tiver certeza.

---

```yaml
operadora:
  nome:
  nome_fantasia:
  registro_ans:
  cnpj:
  sede:
  site:
  tipo: saude | odontologico | saude_e_odontologico

  tipo_planos:
    - individual
    - familiar
    - PME
    - empresarial
    - adesao

  regioes_atendidas: []

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
    hospitais: []
    laboratorios: []
    clinicas: []
    urgencia_emergencia: []

  comissao:
    percentual_inicial: "[A PREENCHER]"
    periodo_inicial: "[A PREENCHER] meses"
    percentual_vitalicio: "[A PREENCHER]"
    tipo: vitalicia | producao | agenciamento
    prazo_pagamento: "[A PREENCHER]"
    dia_pagamento: "[A PREENCHER]"
    observacoes: ""

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
    PJ:
      - "CNPJ"
      - "Contrato social"
      - "Documentos dos beneficiarios"
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
    url: "[A PREENCHER]"
    login: "[PROTEGIDO - usar .env]"
    app_corretor: "[A PREENCHER]"

  contato_comercial:
    nome: "[A PREENCHER]"
    telefone: "[A PREENCHER]"
    email: "[A PREENCHER]"
    whatsapp: "[A PREENCHER]"

  sac:
    telefone: "[A PREENCHER]"
    horario: "[A PREENCHER]"

  diferenciais: []
  restricoes: []

  coparticipacao:
    disponivel: true | false
    descricao: "[A PREENCHER]"

  acomodacao:
    - enfermaria
    - apartamento

  reajuste_anual:
    tipo: "por faixa etaria (ANS) + reajuste anual da operadora"
    indice: "[A PREENCHER]"
    mes_referencia: "[A PREENCHER]"

  portabilidade:
    aceita: true | false
    regras: "[A PREENCHER]"

  cpt:
    cobertura_parcial_temporaria: "24 meses para doencas preexistentes declaradas"
    regras: "[A PREENCHER]"

  app_beneficiario:
    nome: "[A PREENCHER]"
    funcionalidades: []

  observacoes: |
    [Notas gerais sobre a operadora]
```

---

## Instrucoes de uso

1. Copie este template para criar o arquivo de cada operadora.
2. Preencha com dados reais da operadora.
3. Marque `[A PREENCHER]` em tudo que nao tiver certeza.
4. Nunca invente valores, rede credenciada ou percentuais de comissao.
5. Atualize periodicamente conforme novas tabelas e mudancas da operadora.
6. Login e senha de portais NUNCA ficam no arquivo — use referencia `.env`.
