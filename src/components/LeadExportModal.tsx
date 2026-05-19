'use client'

import { useState } from 'react'
import { Lead } from '@/lib/types'
import { X, FileSpreadsheet, FileText } from 'lucide-react'

interface Props {
  leads: Lead[]
  onClose: () => void
}

export default function LeadExportModal({ leads, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  async function exportarExcel() {
    setLoading(true)
    const XLSX = await import('xlsx')
    const dados = leads.map(l => ({
      'Nome': l.nome ?? '',
      'Telefone': l.telefone ?? '',
      'Origem': l.origem ?? '',
      'Tipo de Plano': l.tipo_plano ?? '',
      'Operadora': l.operadora ?? '',
      'Etapa': l.etapa,
      'Responsável': l.responsavel ?? '',
      'Data de Entrada': l.criado_em ? new Date(l.criado_em).toLocaleDateString('pt-BR') : '',
      'Observações': l.observacoes ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')
    XLSX.writeFile(wb, `leads-${new Date().toISOString().slice(0, 10)}.xlsx`)
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
    doc.text('Relatório de Leads', 14, 16)
    doc.setFontSize(10)
    doc.setTextColor(122, 112, 101)
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} · ${leads.length} lead${leads.length !== 1 ? 's' : ''}`, 14, 23)

    autoTable(doc, {
      startY: 30,
      head: [['Nome', 'Telefone', 'Origem', 'Tipo de Plano', 'Operadora', 'Etapa', 'Responsável', 'Data Entrada', 'Observações']],
      body: leads.map(l => [
        l.nome ?? '',
        l.telefone ?? '',
        l.origem ?? '',
        l.tipo_plano ?? '',
        l.operadora ?? '',
        l.etapa,
        l.responsavel ?? '',
        l.criado_em ? new Date(l.criado_em).toLocaleDateString('pt-BR') : '',
        l.observacoes ?? '',
      ]),
      headStyles: { fillColor: [45, 31, 78], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [90, 78, 60] },
      alternateRowStyles: { fillColor: [250, 248, 245] },
      styles: { cellPadding: 3 },
    })

    doc.save(`leads-${new Date().toISOString().slice(0, 10)}.pdf`)
    setLoading(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white">

        <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#2d1f4e' }}>
          <h2 className="text-base font-bold text-white">Exportar Leads</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3" style={{ backgroundColor: '#f4f1ec' }}>
          <p className="text-sm" style={{ color: '#5a4e3c' }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''} {leads.length !== 1 ? 'serão exportados' : 'será exportado'}.
          </p>

          <button
            onClick={exportarExcel}
            disabled={loading}
            className="w-full flex items-center gap-3 p-4 rounded-xl text-left hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e8e4dd' }}
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#e8f5e9' }}>
              <FileSpreadsheet size={20} style={{ color: '#2e7d32' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>Excel (.xlsx)</p>
              <p className="text-xs" style={{ color: '#9a918a' }}>Abre no Excel ou Google Sheets</p>
            </div>
          </button>

          <button
            onClick={exportarPDF}
            disabled={loading}
            className="w-full flex items-center gap-3 p-4 rounded-xl text-left hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e8e4dd' }}
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#fce4ec' }}>
              <FileText size={20} style={{ color: '#c62828' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2d1f4e' }}>PDF</p>
              <p className="text-xs" style={{ color: '#9a918a' }}>Para imprimir ou enviar por WhatsApp</p>
            </div>
          </button>

          {loading && (
            <p className="text-sm text-center animate-pulse" style={{ color: '#9a918a' }}>Gerando arquivo...</p>
          )}
        </div>
      </div>
    </div>
  )
}
