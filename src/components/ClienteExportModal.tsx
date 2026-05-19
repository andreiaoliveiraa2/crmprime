'use client'

import { useState } from 'react'
import { Cliente } from '@/lib/types'
import { X, FileSpreadsheet, FileText } from 'lucide-react'

interface Props {
  clientes: Cliente[]
  onClose: () => void
}

export default function ClienteExportModal({ clientes, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  function fmt(val: number | null) {
    if (val == null) return ''
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  }
  function fmtData(val: string | null) {
    if (!val) return ''
    return new Date(val).toLocaleDateString('pt-BR')
  }

  async function exportarExcel() {
    setLoading(true)
    const XLSX = await import('xlsx')
    const dados = clientes.map(c => ({
      'Nome':               c.nome,
      'CPF':                c.cpf ?? '',
      'Telefone':           c.contato ?? '',
      'Email':              c.email ?? '',
      'Operadora':          c.operadora ?? '',
      'Administradora':     c.administradora ?? '',
      'Tipo de Plano':      c.tipo_plano ?? '',
      'Qtd. Vidas':         c.quantidade_vidas ?? '',
      'Valor (R$)':         fmt(c.valor_plano),
      'Nº Contrato':        c.numero_contrato ?? '',
      'Data da Venda':      fmtData(c.data_venda),
      'Data Implantação':   fmtData(c.data_implantacao),
      'Status':             c.status,
      'Vendedor':           c.vendedor ?? '',
      'Comissão (R$)':      fmt(c.comissao),
      'Observações':        c.observacoes ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    XLSX.writeFile(wb, `clientes-${new Date().toISOString().slice(0, 10)}.xlsx`)
    setLoading(false)
    onClose()
  }

  async function exportarPDF() {
    setLoading(true)
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(16)
    doc.setTextColor(45, 31, 78)
    doc.text('Carteira de Clientes — A2 Prime', 14, 16)
    doc.setFontSize(10)
    doc.setTextColor(122, 112, 101)
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} · ${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`, 14, 23)

    autoTable(doc, {
      startY: 30,
      head: [['Nome', 'Telefone', 'Operadora', 'Tipo', 'Valor', 'Vendedor', 'Data Venda', 'Status']],
      body: clientes.map(c => [
        c.nome,
        c.contato ?? '',
        c.operadora ?? '',
        c.tipo_plano ?? '',
        fmt(c.valor_plano),
        c.vendedor ?? '',
        fmtData(c.data_venda),
        c.status,
      ]),
      headStyles: { fillColor: [45, 31, 78], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [90, 78, 60] },
      alternateRowStyles: { fillColor: [250, 248, 245] },
      styles: { cellPadding: 3 },
    })

    doc.save(`clientes-${new Date().toISOString().slice(0, 10)}.pdf`)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white">

        <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#2d1f4e' }}>
          <h2 className="text-base font-bold text-white">Exportar Clientes</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3" style={{ backgroundColor: '#f4f1ec' }}>
          <p className="text-sm" style={{ color: '#5a4e3c' }}>
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} {clientes.length !== 1 ? 'serão exportados' : 'será exportado'}.
          </p>

          <button onClick={exportarExcel} disabled={loading}
            className="w-full flex items-center gap-3 p-4 rounded-xl text-left hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e8e4dd' }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#e8f5e9' }}>
              <FileSpreadsheet size={20} style={{ color: '#2e7d32' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>Excel (.xlsx)</p>
              <p className="text-xs" style={{ color: '#9a918a' }}>Abre no Excel ou Google Sheets</p>
            </div>
          </button>

          <button onClick={exportarPDF} disabled={loading}
            className="w-full flex items-center gap-3 p-4 rounded-xl text-left hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e8e4dd' }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#fce4ec' }}>
              <FileText size={20} style={{ color: '#c62828' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>PDF</p>
              <p className="text-xs" style={{ color: '#9a918a' }}>Para imprimir ou enviar por WhatsApp</p>
            </div>
          </button>

          {loading && <p className="text-sm text-center animate-pulse" style={{ color: '#9a918a' }}>Gerando arquivo...</p>}
        </div>
      </div>
    </div>
  )
}
