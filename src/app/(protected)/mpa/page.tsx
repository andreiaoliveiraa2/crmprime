'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function MpaPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.response) {
        setMessages([...newMessages, { role: 'assistant', content: data.response }])
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'Erro ao processar. Tente novamente.' }])
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Erro de conexão. Verifique sua internet.' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto p-4">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid #e8e4dd' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #5b3fb5, #b89a6a)' }}>
          <Sparkles size={20} color="#fff" />
        </div>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#2d1f4e' }}>MPA</h1>
          <p className="text-xs" style={{ color: '#9a918a' }}>Sua equipe digital de IA — 46 agentes prontos</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #5b3fb5, #b89a6a)' }}>
              <Sparkles size={32} color="#fff" />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#2d1f4e' }}>Olá! Sou o MPA</h2>
            <p className="text-sm mb-6" style={{ color: '#9a918a', maxWidth: '400px' }}>
              Coordeno sua equipe digital de 5 super-heróis. Me diga o que precisa e eu aciono o herói certo.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {[
                { cmd: 'bom dia', desc: 'Resumo do seu dia' },
                { cmd: 'follow up', desc: 'Quem cobrar hoje' },
                { cmd: 'post hoje', desc: 'Conteúdo pronto' },
                { cmd: 'proteger carteira', desc: 'Clientes em risco' },
              ].map(s => (
                <button key={s.cmd} onClick={() => { setInput(s.cmd); inputRef.current?.focus() }}
                  className="text-left p-3 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: '#faf8f5', border: '1px solid #e8e4dd' }}>
                  <p className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>{s.cmd}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9a918a' }}>{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #5b3fb5, #b89a6a)' }}>
                <Bot size={16} color="#fff" />
              </div>
            )}
            <div className="max-w-[75%] rounded-2xl px-4 py-3"
              style={{
                backgroundColor: msg.role === 'user' ? '#2d1f4e' : '#faf8f5',
                color: msg.role === 'user' ? '#fff' : '#2d1f4e',
                border: msg.role === 'assistant' ? '1px solid #e8e4dd' : 'none',
              }}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#2d1f4e' }}>
                <User size={16} color="#fff" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #5b3fb5, #b89a6a)' }}>
              <Bot size={16} color="#fff" />
            </div>
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#faf8f5', border: '1px solid #e8e4dd' }}>
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" style={{ color: '#b89a6a' }} />
                <span className="text-sm" style={{ color: '#9a918a' }}>Heróis trabalhando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 pt-3" style={{ borderTop: '1px solid #e8e4dd' }}>
        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown} placeholder="Digite um comando ou converse naturalmente..."
          rows={1}
          className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{
            backgroundColor: '#faf8f5', border: '1px solid #e8e4dd',
            color: '#2d1f4e', minHeight: '44px', maxHeight: '120px',
          }}
          onInput={e => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = Math.min(t.scrollHeight, 120) + 'px'
          }}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}
          className="rounded-xl p-3 transition-all hover:scale-105 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #5b3fb5, #b89a6a)' }}>
          <Send size={18} color="#fff" />
        </button>
      </div>
    </div>
  )
}
