import { render, screen } from '@testing-library/react'
import StatsCard from '@/components/StatsCard'

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Total de Clientes" value={42} />)
    expect(screen.getByText('Total de Clientes')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders zero value', () => {
    render(<StatsCard title="Lead" value={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
