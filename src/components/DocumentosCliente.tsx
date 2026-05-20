'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Download, Trash2, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DocumentoCliente } from '@/lib/types'
import AdicionarDocumentoModal from './AdicionarDocumentoModal'

interface Props {
  clienteId: string
}

const TIPO_COR: Record<DocumentoCliente['tipo'], { bg: string; text: string }> = {
  Contrato: { bg: '#dbeafe', text: '#1d4ed8' },
  Proposta: { bg: '#fef3c7', text: '#92400e' },
  RG:       { bg: '#dcfce7', text: '#15803d' },
  CNH:      { bg: '#ede9f8', text: '#2d1f4e' },
  Outro:    { bg: '#f3f4f6', text: '#374151' },
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentosCliente({ clienteId }: Props) {
  const supabase = createClient()
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const { data } = await supabase
      .from('documentos_cliente')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('criado_em', { ascending: false })
    setDocumentos((data ?? []) as DocumentoCliente[])
    setCarregando(false)
  }, [clienteId])

  useEffect(() => { carregar() }, [carregar])

  async function handleDownload(doc: DocumentoCliente) {
    const { data } = await supabase.storage
      .from('clientes-documentos')
      .createSignedUrl(doc.storage_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleExcluir(doc: DocumentoCliente) {
    if (!confirm(`Excluir "${doc.nome_arquivo}"?`)) return
    await supabase.storage.from('clientes-documentos').remove([doc.storage_path])
    await supabase.from('documentos_cliente').delete().eq('id', doc.id)
    carregar()
  }

  return (
    <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e8e4dd' }}>
      <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: '#e8e4dd' }}>
        <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Documentos</h3>
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2d1f4e', color: '#ffffff' }}>
          <Plus size={13} />
          Adicionar
        </button>
      </div>

      {carregando ? (
        <p className="text-sm text-gray-400 py-4 text-center">Carregando...</p>
      ) : documentos.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-gray-400">
          <FileText size={32} strokeWidth={1.5} />
          <p className="text-sm mt-2">Nenhum documento enviado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map(doc => {
            const cor = TIPO_COR[doc.tipo]
            return (
              <div key={doc.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: '#faf8f5' }}>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: cor.bg, color: cor.text }}>
                  {doc.tipo}
                </span>
                <span className="flex-1 text-sm font-medium truncate" style={{ color: '#2d1f4e' }}>
                  {doc.nome_arquivo}
                </span>
                {doc.tamanho_bytes && (
                  <span className="text-xs shrink-0" style={{ color: '#9a918a' }}>
                    {formatBytes(doc.tamanho_bytes)}
                  </span>
                )}
                <button type="button" onClick={() => handleDownload(doc)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                  title="Download">
                  <Download size={14} style={{ color: '#2d1f4e' }} />
                </button>
                <button type="button" onClick={() => handleExcluir(doc)}
                  className="p-1.5 rounded-lg hover:bg-red-100 transition-colors shrink-0"
                  title="Excluir">
                  <Trash2 size={14} style={{ color: '#b91c1c' }} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {modalAberto && (
        <AdicionarDocumentoModal
          clienteId={clienteId}
          onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); carregar() }}
        />
      )}
    </div>
  )
}
