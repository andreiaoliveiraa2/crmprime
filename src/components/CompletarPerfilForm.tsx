'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  authUserId: string
  vendedorId: string
  nomeInicial: string
  email: string
}

export default function CompletarPerfilForm({ authUserId, vendedorId, nomeInicial, email }: Props) {
  const [nome, setNome] = useState(nomeInicial)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setErro('Nome é obrigatório'); return }
    setLoading(true)
    setErro('')

    const { error } = await supabase.from('usuarios').insert({
      auth_user_id: authUserId,
      nome: nome.trim(),
      email,
      perfil: 'vendedor',
      vendedor_id: vendedorId,
      ativo: true,
    })

    if (error) {
      setErro('Erro ao salvar perfil. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f1ec' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md" style={{ border: '1px solid #e8e4dd' }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#2d1f4e' }}>Completar Cadastro</h1>
        <p className="text-sm mb-6" style={{ color: '#9a918a' }}>
          Confirme seu nome para acessar o sistema.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#5a4e3c' }}>
              Nome completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              style={{ border: '1px solid #e8e4dd', color: '#2d1f4e' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#5a4e3c' }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ border: '1px solid #e8e4dd', color: '#9a918a', backgroundColor: '#faf8f5' }}
            />
          </div>

          {erro && <p className="text-sm" style={{ color: '#dc2626' }}>{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-medium text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
            style={{ backgroundColor: '#2d1f4e' }}
          >
            {loading ? 'Salvando...' : 'Acessar o sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}
