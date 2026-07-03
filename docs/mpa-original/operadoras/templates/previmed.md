# [operadora regional]

```yaml
operadora:
  nome: "[A PREENCHER — razao social completa]"
  nome_fantasia: "[operadora regional]"
  registro_ans: "[A PREENCHER — verificar registro ANS]"
  cnpj: "[A PREENCHER]"
  sede: "[A PREENCHER — provavelmente Paraiba ou Nordeste]"
  site: "[A PREENCHER]"
  tipo: saude

  sobre: |
    Operadora regional de planos de saude com atuacao competitiva na Paraiba. 
    Como operadora local, costuma ter preco acessivel e conhecimento profundo 
    do mercado regional. Opcao importante na carteira da corretora para leads 
    sensiveis a preco que buscam alternativa as grandes operadoras.

  tipo_planos:
    - "[A PREENCHER — verificar modalidades: individual, familiar, PME, empresarial]"

  regioes_atendidas:
    - "Joao Pessoa/PB"
    - "[A PREENCHER — verificar demais cidades e estados de atuacao]"

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
    observacao: "[A PREENCHER — verificar se ha regras especificas da [operadora regional]]"

  rede_credenciada_joao_pessoa:
    hospitais:
      - "[A PREENCHER — verificar hospitais credenciados em JP]"
    laboratorios:
      - "[A PREENCHER]"
    clinicas:
      - "[A PREENCHER]"
    urgencia_emergencia:
      - "[A PREENCHER]"
    observacao: "Como operadora regional, a rede em JP pode ser mais focada. Verificar atualizada."

  comissao:
    percentual_inicial: "[A PREENCHER — confirmar com comercial [operadora regional]]"
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
    carteirinha_virtual: "[A PREENCHER — verificar se oferece carteirinha digital]"
    segunda_via: "[A PREENCHER]"

  documentos_necessarios:
    PF:
      - "RG ou documento com foto"
      - "CPF"
      - "Comprovante de residencia"
      - "Declaracao de saude"
      - "[A PREENCHER — verificar documentos adicionais da [operadora regional]]"
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
    - "Operadora regional — conhece bem o mercado da Paraiba"
    - "Preco competitivo na regiao"
    - "Atendimento mais proximo e personalizado (porte menor)"
    - "[A PREENCHER — diferenciais especificos da [operadora regional]]"

  restricoes:
    - "Atuacao regional — pode nao servir para leads fora da area de cobertura"
    - "Rede credenciada menor que grandes operadoras nacionais"
    - "Marca menos conhecida — pode gerar duvida no lead"
    - "[A PREENCHER — restricoes especificas]"

  coparticipacao:
    disponivel: "[A PREENCHER]"
    descricao: "[A PREENCHER]"

  acomodacao:
    - "[A PREENCHER — verificar opcoes de acomodacao]"

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
    [operadora regional] e opcao regional competitiva. Importante na carteira para leads 
    que buscam preco acessivel e nao precisam de cobertura nacional. 
    IMPORTANTE: este template precisa ser preenchido com dados reais da 
    operadora — consultar portal do corretor ou contato comercial.
    Ideal para: leads em JP/PB que buscam preco acessivel.
    Menos indicada para: leads que precisam de cobertura fora da PB.
```
