'use client'

import { useState } from 'react'
import { X, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  clienteId: string
  onClose: () => void
  onSalvo: () => void
}

const TIPOS = ['Contrato', 'Proposta', 'RG', 'CNH', 'Outro'] as const
type Tipo = typeof TIPOS[number]
const MAX_BYTES = 10 * 1024 * 1024
const TIPOS_ACEITOS = [
  'application/pdf', 'image/jpeg', 'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function AdicionarDocumentoModal({ clienteId, onClose, onSalvo }: Props) {
  const supabase = createClient()
  const [tipo, setTipo] = useState<Tipo>('Contrato')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (!TIPOS_ACEITOS.includes(f.type)) {
      setErro('Formato não suportado. Use PDF, JPG, PNG ou DOCX.')
      return
    }
    if (f.size > MAX_BYTES) {
      setErro('Arquivo muito grande. Máximo 10 MB.')
      return
    }
    setErro(null)
    setArquivo(f)
  }

  async function handleEnviar() {
    if (!arquivo) { setErro('Selecione um arquivo.'); return }
    setEnviando(true)
    setErro(null)

    const ext = arquivo.name.split('.').pop()
    const path = `${clienteId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('clientes-documentos')
      .upload(path, arquivo)

    if (uploadErr) {
      setErro('Erro ao enviar arquivo: ' + uploadErr.message)
      setEnviando(false)
      return
    }

    const { error: dbErr } = await supabase.from('documentos_cliente').insert({
      cliente_id: clienteId,
      tipo,
      nome_arquivo: arquivo.name,
      storage_path: path,
      tamanho_bytes: arquivo.size,
    })

    if (dbErr) {
      setErro('Arquivo enviado mas erro ao salvar registro: ' + dbErr.message)
      setEnviando(false)
      return
    }

    onSalvo()
  }

  const inputCls = 'w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2'
  const inputStyle = { borderColor: '#e8e4dd' }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#e8e4dd' }}>
          <h3 className="text-base font-bold" style={{ color: '#2d1f4e' }}>Adicionar Documento</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} style={{ color: '#9a918a' }} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value as Tipo)}
              className={inputCls} style={inputStyle}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2d1f4e' }}>Arquivo</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: arquivo ? '#b89a6a' : '#e8e4dd' }}>
              <Upload size={20} style={{ color: arquivo ? '#b89a6a' : '#9a918a' }} />
              <span className="text-sm mt-2" style={{ color: arquivo ? '#2d1f4e' : '#9a918a' }}>
                {arquivo ? arquivo.name : 'Clique para selecionar'}
              </span>
              <span className="text-xs mt-0.5 text-gray-400">PDF, JPG, PNG, DOCX — máx 10 MB</span>
              <input type="file" className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={handleArquivo} />
            </label>
          </div>

          {erro && (
            <p className="text-sm rounded-xl px-3 py-2" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
              {erro}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t" style={{ borderColor: '#e8e4dd' }}>
          <button onClick={onClose} disabled={enviando}
            className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: '#f0ece6', color: '#5a4e3c' }}>
            Cancelar
          </button>
          <button onClick={handleEnviar} disabled={enviando || !arquivo}
            className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
