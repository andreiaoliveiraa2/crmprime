import { render, screen } from '@testing-library/react'
import DashboardCard from '@/components/DashboardCard'
import { Users } from 'lucide-react'

describe('DashboardCard', () => {
  it('renders title and value', () => {
    render(<DashboardCard title="Total de Clientes" value={42} icon={Users} color="violet" />)
    expect(screen.getByText('Total de Clientes')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders string value', () => {
    render(<DashboardCard title="Ganhos no Mês" value="R$ 1.200,00" icon={Users} color="emerald" />)
    expect(screen.getByText('R$ 1.200,00')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<DashboardCard title="Leads" value={5} icon={Users} color="blue" subtitle="este mês" />)
    expect(screen.getByText('este mês')).toBeInTheDocument()
  })

  it('renders zero value', () => {
    render(<DashboardCard title="Vendas" value={0} icon={Users} color="amber" />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
