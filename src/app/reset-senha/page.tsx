'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetSenhaPage() {
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'erro'>('idle')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (novaSenha !== confirmar) {
      setStatus('erro')
      setMensagem('As senhas não coincidem.')
      return
    }
    if (novaSenha.length < 6) {
      setStatus('erro')
      setMensagem('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setCarregando(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setCarregando(false)
    if (error) {
      setStatus('erro')
      setMensagem('Link expirado ou inválido. Solicite uma nova redefinição na tela de login.')
    } else {
      setStatus('ok')
      setMensagem('Senha alterada com sucesso! Redirecionando...')
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nova senha</h1>
        <p className="text-sm text-gray-500 mb-6">Digite sua nova senha de acesso</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nova-senha" className="block text-sm font-medium text-gray-700 mb-1">
              Nova senha
            </label>
            <input
              id="nova-senha"
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="confirmar" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar nova senha
            </label>
            <input
              id="confirmar"
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              required
              placeholder="Repita a nova senha"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {status !== 'idle' && (
            <p className={`text-sm ${status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando || status === 'ok'}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {carregando ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
