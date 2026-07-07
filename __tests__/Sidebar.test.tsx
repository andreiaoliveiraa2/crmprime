import { render, screen } from '@testing-library/react'
import Sidebar from '@/components/Sidebar'

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn() }),
}))

const mockAgendaChain = {
  select: () => ({
    gte: () => ({
      lte: () => Promise.resolve({ count: 0, error: null }),
    }),
  }),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
    from: (table: string) => {
      if (table === 'agenda') return {
        select: () => ({
          gte: () => ({
            lte: () => Promise.resolve({ count: 0, error: null }),
          }),
        }),
      }
      return {
        select: (_fields: string) => Promise.resolve({ data: [], error: null }),
      }
    },
  }),
}))

describe('Sidebar', () => {
  it('renders the admin navigation items', () => {
    render(<Sidebar perfil="admin" nome="Andreia Oliveira" />)
    expect(screen.getByText('Meu Dia')).toBeInTheDocument()
    expect(screen.getByText('CRM')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Agenda')).toBeInTheDocument()
    expect(screen.getByText('Financeiro')).toBeInTheDocument()
    expect(screen.getByText('Gestão')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
  })

  it('renders the vendedor navigation items and hides admin-only ones', () => {
    render(<Sidebar perfil="vendedor" nome="Alessandro" />)
    expect(screen.getByText('Comissões')).toBeInTheDocument()
    expect(screen.queryByText('Financeiro')).not.toBeInTheDocument()
    expect(screen.queryByText('Gestão')).not.toBeInTheDocument()
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument()
  })

  it('does not render Pipeline', () => {
    render(<Sidebar perfil="admin" nome="Andreia Oliveira" />)
    expect(screen.queryByText('Pipeline')).not.toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(<Sidebar perfil="admin" nome="Andreia Oliveira" />)
    expect(screen.getByText('Sair')).toBeInTheDocument()
  })

  it('renders brand logo', () => {
    render(<Sidebar perfil="admin" nome="Andreia Oliveira" />)
    expect(screen.getByAltText('A2 Prime')).toBeInTheDocument()
  })

  it('renders user footer from props', () => {
    render(<Sidebar perfil="admin" nome="Andreia Oliveira" />)
    expect(screen.getByText('Andreia Oliveira')).toBeInTheDocument()
    expect(screen.getByText('Admin · A2 Prime')).toBeInTheDocument()
    expect(screen.getByText('AO')).toBeInTheDocument()
  })

  it('renders search trigger button', () => {
    render(<Sidebar perfil="admin" nome="Andreia" />)
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument()
  })
})
