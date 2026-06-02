export interface Licao {
  numero: string
  titulo: string
  subtitulo: string
  topicos: Topico[]
}

export interface Topico {
  titulo: string
  conteudo: string
  destaque?: string
  copiavel?: boolean
}

export const LICOES: Licao[] = [
  {
    numero: '01',
    titulo: 'Dominando o WhatsApp Prime',
    subtitulo: 'Configurações essenciais e organização profissional',
    topicos: [
      {
        titulo: 'Foto de Perfil Profissional',
        conteudo: 'Use uma foto profissional com boa iluminação, fundo neutro e vestimenta adequada. Sua foto de perfil transmite confiança e seriedade antes mesmo da primeira mensagem.\n\nEvite fotos casuais, com outras pessoas ou em ambientes inadequados. Você está construindo sua marca pessoal.',
        destaque: '✅ Boa iluminação  ·  ✅ Fundo neutro  ·  ✅ Vestimenta adequada\n❌ Fotos casuais  ·  ❌ Com outras pessoas  ·  ❌ Ambientes inadequados',
      },
      {
        titulo: 'Configurações do WhatsApp Business',
        conteudo: '1. MENSAGEM DE SAUDAÇÃO\nConfigure uma mensagem automática de boas-vindas apresentando você e sua corretora.\nCaminho: Configurações > Ferramentas Comerciais > Saudação\n\n2. ORGANIZAÇÃO COM ETIQUETAS\nCrie etiquetas coloridas para organizar clientes:\n• Renovação Janeiro / Fevereiro\n• Negociação\n• Pedido de Cotação\n\n3. RESPOSTAS RÁPIDAS\nConfigure respostas automáticas para perguntas frequentes, economizando tempo e mantendo agilidade no atendimento.\n\n4. DESCRIÇÃO COMERCIAL\nPreencha seu perfil com informações sobre produtos, horário de atendimento e diferenciais da corretora.',
      },
    ],
  },
  {
    numero: '02',
    titulo: 'Técnicas de Comunicação',
    subtitulo: 'Posicionamento persuasivo e consultivo',
    topicos: [
      {
        titulo: 'Seja um Conselheiro, Não um Vendedor',
        conteudo: 'Não foque apenas em vender. Entenda o que o cliente quer e entregue o que ele precisa. Construa relacionamento e confiança.\n\nNão convença o cliente a comprar. Ajude-o a tomar a melhor decisão. Ouça atentamente e conduza-o ao fechamento naturalmente.\n\nNão venda focando no produto. Foque em como o cliente vai se sentir mais tranquilo e protegido com sua solução.',
        destaque: '"No mundo das vendas, quanto mais clientes você ajudar, mais você vai crescer e prosperar."',
      },
      {
        titulo: 'Mude Sua Linguagem de Vendas',
        conteudo: 'Faça essas trocas no seu vocabulário:',
        destaque: 'De "Vender"      →  Para "Ajudar"\nDe "Oferecer"    →  Para "Apresentar"\nDe "Convencer"   →  Para "Aconselhar"',
      },
    ],
  },
  {
    numero: '03',
    titulo: 'Recepção e Atendimento Inicial',
    subtitulo: 'Primeiras impressões que convertem',
    topicos: [
      {
        titulo: 'Primeiro Momento: Seja Receptivo',
        conteudo: 'Demonstre felicidade com o contato do futuro cliente. Apresente-se de forma simples e ágil, mencionando seu nome e a corretora.',
      },
      {
        titulo: 'Script — Seguros',
        conteudo: 'Olá, seja bem-vindo(a). Feliz pelo seu contato! Prazer, meu nome é [NOME], sou da [CORRETORA]. Trabalhamos com 15 seguradoras, atendimento nacional. Sou especialista em conseguir os melhores negócios, Preços + Benefícios junto aos clientes.',
        copiavel: true,
      },
      {
        titulo: 'Script — Planos de Saúde',
        conteudo: 'Olá, seja bem-vindo(a). Feliz pelo seu contato! Prazer, meu nome é [NOME], sou da [CORRETORA]. Trabalhamos com 15 operadoras de planos de saúde, atendimento nacional.',
        copiavel: true,
      },
    ],
  },
  {
    numero: '04',
    titulo: 'Descoberta de Necessidades',
    subtitulo: 'Extraindo o que o cliente realmente deseja',
    topicos: [
      {
        titulo: 'Os 3 Passos',
        conteudo: '1. PERGUNTE O OBJETIVO\nDescubra se é um seguro novo ou renovação. Para planos de saúde, se é primeira contratação ou redução de custos.\n\n2. COLETE INFORMAÇÕES\nEnvie um formulário para coletar dados necessários. Enquanto o cliente preenche, compartilhe seu Instagram ou site da corretora.\n\n3. CONFIRME RECEBIMENTO\nAo receber as informações, confirme que está preparando os orçamentos e mantenha o cliente engajado.',
      },
    ],
  },
  {
    numero: '05',
    titulo: 'Apresentação de Orçamentos',
    subtitulo: 'Roteiro de vendas com autoridade',
    topicos: [
      {
        titulo: 'Estrutura do Áudio (35–45 segundos)',
        conteudo: 'Use áudios curtos com autoconfiança. Cite pelo menos 5 nomes de seguradoras para demonstrar que pesquisou amplamente.\n\n1. Cumprimente o cliente pelo nome\n2. Mencione que cotou em 15 seguradoras\n3. Cite 5 nomes específicos de seguradoras\n4. Apresente a melhor opção\n5. Garanta que a seguradora vai servi-lo muito bem',
        destaque: 'Garantia · Qualidade · Solução · Consultoria\n"A seguradora vai servi-lo muito bem"',
      },
      {
        titulo: 'Apresentação de Benefícios e Coberturas',
        conteudo: 'Não foque no produto — foque na transformação, tranquilidade e solução que vai gerar na vida do cliente. Faça o cliente se imaginar já tendo essas coberturas.\n\nSEGURO DE VIDA:\nMorte natural R$ 500 mil, morte acidental R$ 500 mil, invalidez permanente R$ 500 mil, doenças graves R$ 200 mil, funeral familiar R$ 10 mil para toda a família incluindo filhos.\n\nPLANO DE SAÚDE:\nPlano ambulatorial, cirurgias + internação, cobertura nacional sem coparticipação. Urgência e emergência, consultas eletivas, alta complexidade, atendimento em hospitais, consultórios e clínicas.',
      },
      {
        titulo: 'Momento Crucial: Pare, Pergunte e Ouça',
        conteudo: 'Antes de apresentar valores, pergunte se o cliente tem dúvidas sobre algum item do produto. A maioria dos clientes possui dúvidas — é crucial esclarecer tudo antes da oferta.\n\nAté agora você dominou a negociação. Agora deixe o cliente se expressar. Se ele tiver dúvidas, este é o momento de dar uma aula sobre o assunto.',
      },
      {
        titulo: 'Dê uma Consultoria de Valor',
        conteudo: 'EXPLIQUE A REDE\nMuitos clientes escolhem o plano pelos hospitais, clínicas e laboratórios que ele atende.\n\nESCLAREÇA A UTILIZAÇÃO\nExplique como usar o plano no dia a dia: consultas, exames, autorizações e atendimentos de urgência.\n\nDETALHE AS CARÊNCIAS\nUrgência: 24h  ·  Exames simples: 30 dias  ·  Cirurgias: 180 dias  ·  Doenças pré-existentes: 24 meses',
      },
    ],
  },
  {
    numero: '06',
    titulo: 'Ofertas de Fechamento',
    subtitulo: 'Condução estratégica ao contrato',
    topicos: [
      {
        titulo: 'Fechamento — Seguro de Vida',
        conteudo: 'Foque no parcelamento máximo — o brasileiro está acostumado a comprar parcelado. Vai soar melhor e ajudar na decisão rápida.\n\nExemplo de apresentação:\n"Valor da proteção ESTAVA 12x R$ 500. Com contato direto com o gerente da seguradora, consegui oportunidade única: 12x R$ 250 sem juros."',
        destaque: 'Pergunta de fechamento: "Qual é a melhor forma de pagamento para você, débito em conta ou cartão de crédito?"',
        copiavel: true,
      },
      {
        titulo: 'Fechamento — Plano de Saúde',
        conteudo: 'SEM COPARTICIPAÇÃO:\nValor ESTAVA R$ 698 mensal. Com mega desconto: R$ 577 mensal. Excelente oportunidade no débito em conta ou boleto mensal.\n\nCOM COPARTICIPAÇÃO:\nValor ESTAVA R$ 562,99 mensal. Com mega desconto: R$ 417 mensal. Opção mais econômica no débito em conta ou boleto mensal.\n\nMesmo que o plano de saúde seja tabelado, aplique as técnicas de ancoragem. Foque na transformação que o cliente terá.',
        destaque: 'Pergunta de fechamento: "Qual é a melhor opção de plano para você? E qual é a melhor forma de pagamento? Débito em conta ou boleto?"',
        copiavel: true,
      },
      {
        titulo: 'Venda Realizada — Pós-Fechamento',
        conteudo: '1. NÃO PERGUNTE SE PODE FINALIZAR\nO cliente já decidiu. Vá direto ao fechamento sem colocá-lo para pensar novamente.\n\n2. COLETE AS INFORMAÇÕES\nPeça RG, órgão expedidor, data de emissão, endereço, segundo telefone e dados bancários.\n\n3. FINALIZE E AGRADEÇA\nEnvie contrato, número da assistência e figurinha da corretora. Agradeça pela confiança e peça indicações.',
      },
    ],
  },
]
