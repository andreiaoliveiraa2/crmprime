'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AlterarSenhaForm() {
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'erro'>('idle')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
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
      setMensagem('Erro ao alterar senha. Tente novamente.')
    } else {
      setStatus('ok')
      setMensagem('Senha alterada com sucesso!')
      setNovaSenha('')
      setConfirmar('')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-lg mt-6">
      <h3 className="text-base font-semibold text-stone-800 mb-5">Alterar Senha</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-500 mb-1">Nova senha</label>
          <input
            type="password"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            required
            className="w-full text-sm text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-500 mb-1">Confirmar nova senha</label>
          <input
            type="password"
            value={confirmar}
            onChange={e => setConfirmar(e.target.value)}
            required
            className="w-full text-sm text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="Repita a nova senha"
          />
        </div>
        {status !== 'idle' && (
          <p className={`text-sm ${status === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
            {mensagem}
          </p>
        )}
        <button
          type="submit"
          disabled={carregando}
          className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          {carregando ? 'Salvando...' : 'Alterar senha'}
        </button>
      </form>
    </div>
  )
}
