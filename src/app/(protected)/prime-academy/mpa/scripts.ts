export type Categoria = 'abordagem' | 'objecao'
export type Formato = 'texto' | 'audio'

export interface Script {
  numero: string
  titulo: string
  categoria: Categoria
  formato: Formato
  descricao: string
  conteudo: string
  dica?: string
}

export const SCRIPTS: Script[] = [
  {
    numero: '01',
    titulo: 'Como Iniciar o Contato com o Cliente',
    categoria: 'abordagem',
    formato: 'texto',
    descricao: 'Formas profissionais de começar a conversa e se apresentar.',
    conteudo: `CLIENTE DE INDICAÇÃO:
Você: Olá [Nome], tudo bem?
Cliente: Tudo sim e você?
Você: Tudo ótimo! Prazer, meu nome é [nome], sou corretor de [seguros ou Saúde] do [Nome do indicador], sou da corretora [x], tudo bem?

CLIENTE DE LEADS:
Você: Olá [Nome], tudo bem?
Cliente: Tudo sim e você?
Você: Tudo ótimo! Prazer, meu nome é [nome], sou corretor de [seguros ou Saúde], sou da corretora [x]. Você solicitou um orçamento através de um formulário, certo?`,
    dica: 'Sempre deixe uma pergunta no final e nunca envie textos longos. Envie mensagens rápidas e objetivas para manter o cliente engajado.',
  },
  {
    numero: '02',
    titulo: 'Incentivar o Cliente a Comprar Novamente',
    categoria: 'abordagem',
    formato: 'texto',
    descricao: 'Táticas de reativação e aumento de vendas para quem já comprou.',
    conteudo: `SEGURO VIDA:
Você: Olá [Nome], tudo bem?
Cliente: Tudo sim e você?
Você: Tudo ótimo! Estamos com excelentes condições de Seguro de Vida, contratação nova ou revisão do seguro atual, com até 10% de desconto válido até hoje. Vamos cotar?

PLANO DE SAÚDE:
Você: E estamos também com planos de saúde regional e nacional, com o preço de tabela reduzida a 10% abaixo do normal. Vamos orçar um plano de saúde para você?`,
    dica: 'Clientes antigos são mais fáceis de converter. Use ofertas exclusivas e urgência para incentivá-los a comprar novamente.',
  },
  {
    numero: '03',
    titulo: 'Cliente Que Não Responde',
    categoria: 'abordagem',
    formato: 'texto',
    descricao: 'Maneiras de retomar o diálogo com leads que ficaram em silêncio.',
    conteudo: `SCRIPT DE ENCERRAMENTO RESPEITOSO:
Você: Olá [Nome], tudo bem? Tentei contato com você de várias formas, porém sem sucesso. Visando o respeito que temos um pelo outro, posso entender o seu silêncio como falta de interesse. Vou encerrar essa negociação, ok?`,
    dica: 'Ao comunicar que vai encerrar o atendimento, você cria um senso de urgência e perda no cliente. Essa abordagem demonstra profissionalismo e respeito pelo tempo de ambas as partes.',
  },
  {
    numero: '04',
    titulo: 'Não Ser Deixado no Vácuo',
    categoria: 'abordagem',
    formato: 'texto',
    descricao: 'Estratégias para manter o cliente ativo e participando da conversa.',
    conteudo: `TÉCNICA DAS PERGUNTAS ESTRATÉGICAS:
A chave é transformar cada mensagem em uma oportunidade de resposta. Sempre termine com perguntas diretas que exigem uma escolha ou confirmação.

Exemplo 1 – Confirmação de entendimento:
"Tudo bem? Você tem alguma dúvida sobre esse item? Ficou bem claro como funciona?"

Exemplo 2 – Escolha binária:
"Qual a melhor opção para você: 1 ou 2?"

Exemplo 3 – Forma de pagamento:
"Qual a melhor forma de pagamento para você: boleto ou débito em conta?"`,
    dica: 'Sempre que conversar com seu cliente por texto ou áudio no WhatsApp, deixe uma pergunta no final para que ele se comprometa a te responder.',
  },
  {
    numero: '05',
    titulo: 'Cliente com Receio de Fechar pelo WhatsApp',
    categoria: 'objecao',
    formato: 'audio',
    descricao: 'Como fortalecer a confiança e transmitir segurança no atendimento digital.',
    conteudo: `Você: [Nome], pode ficar tranquilo(a)!

Somos uma empresa séria e mantemos todos os dados em total sigilo, garantindo a sua segurança.

Para realizar o orçamento ou fechar o contrato, preciso coletar apenas as informações necessárias para dar seguimento ao atendimento.

Para que você se sinta ainda mais seguro(a), vou te enviar o link do nosso site e do nosso Instagram. Assim, você pode conhecer um pouco da nossa estrutura e, quando se sentir à vontade, é só me chamar por aqui.`,
  },
  {
    numero: '06',
    titulo: 'Primeira Adesão Não Paga',
    categoria: 'abordagem',
    formato: 'audio',
    descricao: 'Como tratar situações de inadimplência logo na entrada.',
    conteudo: `Olá, [Nome], tudo bem?

Notei aqui no sistema que a primeira parcela do seguro/plano de saúde estava prevista para o dia [X], mas ainda aparece como pendente.

Aconteceu algo que eu possa te ajudar a resolver?

Se precisar, posso ajustar ou reprogramar essa parcela para você.`,
    dica: 'Prefira enviar essa mensagem em áudio.',
  },
  {
    numero: '07',
    titulo: 'Cliente sem Disponibilidade para Responder no WhatsApp',
    categoria: 'abordagem',
    formato: 'audio',
    descricao: 'Soluções alternativas para manter a comunicação funcionando.',
    conteudo: `Tudo bem, [Nome]. Vou deixar a mensagem em áudio por aqui e, quando você tiver um tempinho, me responde, combinado?`,
    dica: 'Hoje em dia as pessoas têm uma rotina bem corrida. Por isso, nem sempre conseguem dar atenção imediata às mensagens. Respeite o ritmo do cliente.',
  },
  {
    numero: '08',
    titulo: 'Quando o Cliente Informa Quem Indicou o Contato',
    categoria: 'abordagem',
    formato: 'texto',
    descricao: 'Como responder de forma profissional e fortalecer a autoridade.',
    conteudo: `INDICAÇÃO:
"Olá, [Nome]! Eu sou corretor(a) e falo por indicação do [Nome do indicante]. Ele comentou que você tinha interesse em [seguro/plano de saúde]. Você se lembra dele(a)? Por isso ele me autorizou a entrar em contato com você."

CAPTAÇÃO (FORMULÁRIO):
"Olá, [Nome]! Prazer, meu nome é [Seu nome], sou corretor(a) da [Nome da corretora]. Recebi a sua solicitação através do formulário que você preencheu, relacionada a [seguro/plano de saúde]. Está correto?"`,
  },
  {
    numero: '09',
    titulo: 'Resistência em Compartilhar Dados',
    categoria: 'objecao',
    formato: 'audio',
    descricao: 'Como lidar com dúvidas relacionadas à privacidade e segurança das informações.',
    conteudo: `"[Nome], fique tranquilo(a).

Somos uma empresa séria e prezamos muito pela segurança dos nossos clientes. Todas as informações que você me enviar serão utilizadas apenas para a análise e, após a finalização do contrato, são excluídas.

Caso ainda assim você prefira não enviar os dados por aqui, posso te ligar ou agendar uma reunião por vídeo chamada, para conversamos, da forma que você se sentir mais confortável."`,
  },
  {
    numero: '10',
    titulo: 'Abordagem em Grupos do WhatsApp',
    categoria: 'abordagem',
    formato: 'texto',
    descricao: 'Estratégias de prospecção dentro de comunidades e listas coletivas.',
    conteudo: `Você: "Oi, [Nome]! Tudo bem?"
Cliente: "Tudo sim, e você?"
Você: "Tudo ótimo! Prazer, meu nome é [Seu nome]. Sou corretor(a) de [seguros/plano de saúde] e também faço parte do grupo [nome do grupo]. Trabalho pela corretora [nome da corretora]."

PARA SEGUROS:
"Hoje estou com uma condição especial, com desconto em seguro auto ou seguro de vida, válida apenas para hoje, e achei interessante compartilhar com o pessoal do grupo. Você teria interesse em receber mais informações?"

PARA PLANO DE SAÚDE:
"Estou com condições diferenciadas em planos de saúde, com valores abaixo do habitual, válidas apenas para hoje. Resolvi compartilhar com o pessoal do grupo e queria saber se você tem interesse em conhecer."`,
  },
  {
    numero: '11',
    titulo: 'Vou Analisar Primeiro',
    categoria: 'objecao',
    formato: 'audio',
    descricao: 'Técnicas para evitar adiamentos e estimular a decisão.',
    conteudo: `"[Nome], posso te fazer uma pergunta rápida?

Na maioria das vezes, quando alguém diz que vai pensar, é porque ficou alguma dúvida ou insegurança — seja sobre o produto ou sobre a forma de pagamento.

Tem algum ponto específico que te deixou em dúvida e que eu posso te explicar melhor agora?"

(Deixe o cliente se expressar completamente, e em seguida pergunte:)
"Como posso ajudá-lo a tomar uma decisão hoje?"`,
    dica: 'Quando o cliente diz que vai pensar, raramente é sobre pensar de verdade. É um sinal de que ele tem dúvidas não resolvidas ou não percebeu o valor completo da oferta.',
  },
  {
    numero: '12',
    titulo: 'Vou Pensar e Te Aviso',
    categoria: 'objecao',
    formato: 'audio',
    descricao: 'Como conduzir para um fechamento claro e firme, sem pressão.',
    conteudo: `PERGUNTA DE QUALIFICAÇÃO:
"[Nome], deixa eu te fazer uma pergunta importante, pode ser? Se dependesse apenas de você, hoje, você fecharia essa contratação agora?"

(Se SIM: o bloqueio é insegurança, não autoridade.)
(Se NÃO: existe um terceiro na decisão.)

Siga com: "Entendi. Hoje essa decisão depende só de você ou tem mais alguém que participa dessa escolha?"

IDENTIFICAÇÃO DE DÚVIDAS:
"Agora me conta uma coisa, [Nome]: qual é o principal ponto que ainda está te deixando em dúvida e te impedindo de tomar essa decisão agora?"

(Após a resposta:)
"Perfeito, obrigado por me explicar. O que eu posso fazer, nesse momento, para te ajudar a se sentir mais seguro(a) e conseguir avançar com essa decisão hoje?"`,
  },
  {
    numero: '13',
    titulo: 'Está Caro',
    categoria: 'objecao',
    formato: 'audio',
    descricao: 'Técnicas de justificação de valor.',
    conteudo: `PRIMEIRA ABORDAGEM — Perguntas investigativas:
"Compreendo, [Nome]. Me deixe fazer uma pergunta: quando você diz que o preço está caro, você está comparando esse preço com qual outra proposta no mercado, ou o valor não condiz com as coberturas?"

(Essa pergunta força o cliente a ser específico e revela se ele realmente pesquisou ou está apenas testando você.)

SEGUNDA ABORDAGEM — Se o cliente insistir:
Investigue mais profundamente. Pode ser forma de pagamento, momento financeiro ou falta de percepção de valor. Reforce os benefícios e diferenciais antes de discutir qualquer ajuste de preço.`,
    dica: 'Quando um cliente diz que está caro, ele raramente está se referindo ao preço absoluto. Na maioria das vezes, ele não percebeu o valor suficiente.',
  },
  {
    numero: '14',
    titulo: 'Cliente Só Quer Saber o Preço',
    categoria: 'objecao',
    formato: 'audio',
    descricao: 'Controlando a negociação.',
    conteudo: `"Entendo, [Nome]. Para te passar um valor correto e dentro do que realmente atenda à sua necessidade, preciso primeiro fazer uma simulação. Para isso, vou precisar de algumas informações básicas, tudo bem?"

JOGUE O SEU JOGO:
1. Colete informações — espere ele fornecer os dados antes de prosseguir.
2. Apresente o produto — comece a agregar valor, destacando os principais benefícios.
3. Desperte curiosidade — mantenha o interesse antes de revelar o preço final.
4. Revele o valor — só mostre o preço quando o cliente estiver 100% estruturado e sem dúvidas.`,
    dica: 'Quando você revela o preço antes de estabelecer o valor, o cliente não tem contexto para avaliar se é justo. O preço sem valor percebido sempre parecerá caro.',
  },
  {
    numero: '15',
    titulo: 'Só Compra Com Desconto',
    categoria: 'objecao',
    formato: 'audio',
    descricao: 'Gerenciando expectativas de preço.',
    conteudo: `"Entendo, [Nome], que você queira economizar na contratação do seu plano. Porém, para manter o padrão de qualidade, segurança e assistência que a operadora oferece a todos os clientes, essa é a melhor condição que consigo trabalhar."`,
    dica: 'Em vez de ceder imediatamente ao desconto, reforce o valor agregado, os diferenciais exclusivos e os benefícios que o cliente receberá. Mostre que o preço reflete a qualidade e o serviço oferecido.',
  },
  {
    numero: '16',
    titulo: 'Encontrou Mais Barato',
    categoria: 'objecao',
    formato: 'audio',
    descricao: 'Diferenciação competitiva.',
    conteudo: `OPÇÃO 1 — Consultiva e educativa (muito forte):
"Entendo, [Nome], é natural comparar preços. Mas é importante esclarecer: planos de saúde e seguros trabalham com valores tabelados pelas operadoras. Ou seja, o preço em si não muda de corretor para corretor.

O que realmente faz diferença são as coberturas, os benefícios incluídos, a rede credenciada, e principalmente o suporte no pós-venda.

No meu trabalho, eu não cuido apenas da venda. Eu acompanho você no dia a dia: autorizações, dúvidas, uso do plano, reajustes e qualquer necessidade que surgir.

Me conta: o que você considerou mais importante nessa outra proposta, para eu te mostrar se aqui você está realmente melhor assistido?"

OPÇÃO 2 — Profissional e segura:
"[Nome], encontrar um valor aparentemente menor acontece. Mas em planos de saúde e seguros, os valores são definidos pela operadora, não pelo corretor.

Se quiser, posso comparar as duas propostas com você, ponto a ponto, para ter certeza de que está fazendo a melhor escolha."`,
  },
  {
    numero: '17',
    titulo: 'Conversar Com Cônjuge',
    categoria: 'objecao',
    formato: 'audio',
    descricao: 'Envolvendo decisores.',
    conteudo: `"[Nome], se a decisão dependesse apenas de você e de mim, nós já conseguiríamos avançar com essa contratação."

PASSOS:
1. Ofereça materiais — forneça informações que ele possa compartilhar com o cônjuge.
2. Agende reunião conjunta — propor falar com ambos evita o jogo de telefone sem fio.
3. Estabeleça prazo — combine um retorno específico após a conversa.`,
  },
  {
    numero: '18',
    titulo: 'Não Tem Dinheiro',
    categoria: 'objecao',
    formato: 'audio',
    descricao: 'Essa é a mais desafiadora.',
    conteudo: `PERGUNTA HIPOTÉTICA:
"[Nome], se dinheiro não fosse o impedimento, você contrataria o seguro/plano de saúde agora?"
(Aguarde a resposta antes de prosseguir.)

INVESTIGAÇÃO PROFUNDA:
"Eu quero entender melhor: o que está impedindo você de tomar uma decisão agora, é o valor total ou a forma de pagamento?"

TESTE DE COMPROMISSO:
"Se eu conseguir uma condição que caiba nas suas condições financeiras, você toma uma decisão hoje?"`,
    dica: 'Descubra se é realmente uma questão financeira ou falta de percepção de valor. Só então trabalhe alternativas de pagamento.',
  },
  {
    numero: '19',
    titulo: 'Leads Frios — Reaquecendo Contatos Antigos',
    categoria: 'abordagem',
    formato: 'texto',
    descricao: 'Reaquecendo contatos antigos.',
    conteudo: `"Bom dia, [Nome], tudo bem?"
(Aguarde a resposta. Normalmente o cliente dirá: "Olá, bom dia! Quem fala?")

"Prazer, [Nome]. Meu nome é [seu nome], sou corretor(a) especializado(a) em [produto], da corretora [X]. Tive acesso ao seu contato por meio de [origem] e estamos com uma condição especial esta semana."

PASSOS:
1. Reintrodução contextual — relembre como vocês se conheceram.
2. Oferta de valor imediato — apresente algo novo ou promoção que justifique o contato.
3. Pergunta qualificadora — descubra rapidamente se ainda há interesse.
4. Caminho claro de ação — facilite o próximo passo com opções simples e diretas.`,
  },
  {
    numero: '20',
    titulo: 'Cliente Não Enviou a Documentação',
    categoria: 'abordagem',
    formato: 'texto',
    descricao: 'Ofereça múltiplas formas de envio.',
    conteudo: `"[Nome], percebi que ainda estamos aguardando sua documentação para finalizar o processo. Existe alguma dificuldade que eu possa ajudar? Posso facilitar de alguma forma o envio?"`,
    dica: 'Ofereça múltiplas formas de envio (foto, PDF, presencial) e explique exatamente quais documentos são necessários.',
  },
  {
    numero: 'BÔNUS',
    titulo: 'Pedindo Indicações',
    categoria: 'abordagem',
    formato: 'texto',
    descricao: 'Uma das coisas mais importantes — peça indicações após o fechamento.',
    conteudo: `"[Nome], estou muito feliz que conseguimos encontrar a melhor solução para você. Você conhece alguém que também poderia se beneficiar de ter um seguro/plano de saúde de qualidade?"`,
    dica: 'Peça indicações logo após um fechamento bem-sucedido, quando o cliente está mais satisfeito.',
  },
]
