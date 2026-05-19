import { render, screen } from '@testing-library/react'
import Sidebar from '@/components/Sidebar'

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}))

describe('Sidebar', () => {
  it('renders all 8 navigation items', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('CRM')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Agenda')).toBeInTheDocument()
    expect(screen.getByText('Financeiro')).toBeInTheDocument()
    expect(screen.getByText('Gestão')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
  })

  it('does not render Pipeline', () => {
    render(<Sidebar />)
    expect(screen.queryByText('Pipeline')).not.toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(<Sidebar />)
    expect(screen.getByText('Sair')).toBeInTheDocument()
  })

  it('renders brand name', () => {
    render(<Sidebar />)
    expect(screen.getByText('A2 Prime')).toBeInTheDocument()
  })

  it('renders user footer', () => {
    render(<Sidebar />)
    expect(screen.getByText('Andreia Oliveira')).toBeInTheDocument()
    expect(screen.getByText('CEO · A2 Prime')).toBeInTheDocument()
    expect(screen.getByText('AO')).toBeInTheDocument()
  })
})
