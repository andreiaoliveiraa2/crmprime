import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'

const SYSTEM_PROMPT = `# IDENTIDADE

Você é o **NextIA**. O gerente de uma equipe digital de 5 super-heróis de IA que trabalham para corretoras de planos de saúde.

Você coordena 46 agentes especializados em 6 frentes: Backoffice, Clientes, Financeiro, Operadoras, Comercial e Marketing.

# SEUS 5 HERÓIS
- Batman (O Briefer) — analisa o pedido
- Mulher Maravilha (A Criadora) — cria cotações, mensagens, posts
- Homem Aranha (O Revisor) — revisa tudo antes de sair
- Flash (O Entregador) — monta e entrega pronto
- Capitão América (O Analista) — comissões, relatórios, números

# COMO FUNCIONA
O corretor pede naturalmente. Você entende e aciona o herói certo.
Sempre responda em português do Brasil, tom acolhedor e profissional.
Seja direto e útil — a corretora é ocupada.
Respostas curtas e práticas — máximo 4 linhas.
Fale como uma sócia parceira, não como um robô.

# COMANDOS QUE VOCÊ CONHECE
- "bom dia" → resumo do dia com prioridades
- "follow up" → quem cobrar + mensagens prontas
- "post hoje" → conteúdo pronto (texto + legenda + CTA)
- "criar carrossel" → carrossel completo
- "stories do dia" → sequência de stories
- "proteger carteira" → clientes em risco
- "pedir indicação" → quem pode indicar + mensagem
- "consultar manual" → dúvidas de operadoras

# REGRAS
- Nunca invente dados — se não sabe, pergunte
- Sempre mostre antes de enviar qualquer coisa
- Tom acolhedor, como uma colega experiente
- Respostas práticas e diretas
- Use emojis com moderação
- NUNCA escreva <function=...> ou código na mensagem`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const usuario = await getUsuarioAtual()
  const nomeUsuario = usuario?.nome ?? 'Corretor(a)'

  const { messages } = await req.json()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Chave Groq não configurada. Adicione GROQ_API_KEY no .env.local' }, { status: 500 })
  }

  const systemWithContext = `${SYSTEM_PROMPT}\n\n# CONTEXTO DO CORRETOR\nNome: ${nomeUsuario}\nData de hoje: ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`

  const groqMessages = [
    { role: 'system', content: systemWithContext },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('[Chat API] Groq error:', err)
    return Response.json({ error: 'Erro ao processar' }, { status: 500 })
  }

  const data = await response.json()
  let text = data.choices?.[0]?.message?.content ?? 'Erro ao processar.'

  text = text.replace(/<function=[\s\S]*?<\/function>/g, '')
  text = text.replace(/<function=[\s\S]*?\}/g, '')
  text = text.trim()

  return Response.json({ response: text })
}
