import { render, screen } from '@testing-library/react'
import MetaMesCard from '@/components/MetaMesCard'
import { ResumoMeta } from '@/lib/calcularMetas'

const resumo: ResumoMeta = {
  totalMeta: 8000, totalVendido: 4200, pct: 53, falta: 3800, ritmoSemana: 1900,
  linhas: [
    { operadora: 'SulAmérica', meta: 5000, vendido: 3200, pct: 64, falta: 1800 },
    { operadora: 'Amil', meta: 3000, vendido: 1000, pct: 33, falta: 2000 },
  ],
}

describe('MetaMesCard', () => {
  it('mostra o total, o % e cada operadora com o que falta', () => {
    render(<MetaMesCard resumo={resumo} subtitulo="julho · semana 2 de 5" />)
    expect(screen.getByText('Meta do mês')).toBeInTheDocument()
    expect(screen.getByText('53%')).toBeInTheDocument()
    expect(screen.getByText('SulAmérica')).toBeInTheDocument()
    expect(screen.getByText('Amil')).toBeInTheDocument()
    // não usa termos de funil
    expect(screen.queryByText(/abordagen/i)).toBeNull()
    expect(screen.queryByText(/proposta/i)).toBeNull()
  })

  it('estado vazio quando não há meta nem venda', () => {
    const vazio: ResumoMeta = { totalMeta: 0, totalVendido: 0, pct: 0, falta: 0, ritmoSemana: 0, linhas: [] }
    render(<MetaMesCard resumo={vazio} subtitulo="julho" />)
    expect(screen.getByText(/nenhuma meta definida/i)).toBeInTheDocument()
  })
})
