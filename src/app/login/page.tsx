'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleEsqueciSenha() {
    if (!email) {
      setErro('Digite seu e-mail antes de solicitar a recuperação')
      return
    }
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-senha`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      setErro('Erro ao enviar e-mail. Tente novamente.')
    } else {
      setMensagem('E-mail de recuperação enviado. Verifique sua caixa de entrada.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos')
      setLoading(false)
      return
    }

    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Painel esquerdo — branco ── */}
      <div className="flex flex-col items-center justify-center px-12 py-16 bg-white" style={{ flex: '1 1 62%' }}>
        <Image
          src="/logo-a2prime.png"
          alt="A2 Prime"
          width={360}
          height={140}
          className="object-contain"
          style={{ maxHeight: '140px', width: 'auto' }}
          priority
        />

        <blockquote className="mt-8 text-center max-w-xs">
          <p
            className="leading-relaxed"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1rem',
              lineHeight: '1.8',
              color: '#5a4e3c',
            }}
          >
            "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos."
          </p>
          <cite
            className="block mt-3 not-italic text-xs tracking-[0.2em] uppercase"
            style={{ color: '#b89a6a', fontFamily: 'Georgia, serif' }}
          >
            Provérbios 16:3
          </cite>
        </blockquote>

        {/* Formulário — somente mobile */}
        <div className="md:hidden w-full max-w-xs mt-12">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#5a4e3c' }}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{ border: '1px solid #d5cfc9', color: '#2d1f4e', backgroundColor: 'white' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#5a4e3c' }}>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{ border: '1px solid #d5cfc9', color: '#2d1f4e', backgroundColor: 'white' }}
              />
            </div>
            {erro && <p className="text-red-600 text-sm">{erro}</p>}
            {mensagem && <p className="text-green-600 text-sm">{mensagem}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#b89a6a' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={handleEsqueciSenha}
              className="w-full text-sm text-center hover:underline"
              style={{ color: '#7a7065' }}
            >
              Esqueci minha senha
            </button>
          </form>
        </div>
      </div>

      {/* ── Painel direito — roxo (somente desktop) ── */}
      <div
        className="hidden md:flex flex-col justify-center py-16"
        style={{ backgroundColor: '#2d1f4e', flex: '1 1 38%', paddingLeft: '5%', paddingRight: '5%' }}
      >
        <div
          className="w-full rounded-2xl p-8"
          style={{
            maxWidth: '320px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h1
            className="text-2xl font-bold mb-1 text-white"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Bem-vinda
          </h1>
          <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Acesse o seu sistema de gestão
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              />
            </div>

            {erro && <p className="text-red-300 text-sm">{erro}</p>}
            {mensagem && <p className="text-green-300 text-sm">{mensagem}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ backgroundColor: '#b89a6a' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={handleEsqueciSenha}
              className="w-full text-sm text-center hover:underline"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Esqueci minha senha
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}
