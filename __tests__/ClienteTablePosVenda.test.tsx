import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClienteTablePosVenda from '@/components/ClienteTablePosVenda'
import { Cliente } from '@/lib/types'

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      delete: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
    }),
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

const clientes: Cliente[] = [
  {
    id: '1', nome: 'Ana Lima', contato: '(83) 99999-1111', email: 'ana@email.com',
    tipo_plano: 'Saúde', operadora: null, quantidade_vidas: null, valor_plano: 0, observacoes: null, lead_id: null, criado_em: '',
  },
  {
    id: '2', nome: 'Bruno Costa', contato: null, email: null,
    tipo_plano: 'Odonto', operadora: null, quantidade_vidas: null, valor_plano: 0, observacoes: null, lead_id: null, criado_em: '',
  },
]

describe('ClienteTablePosVenda', () => {
  it('renders all clients by default', () => {
    render(<ClienteTablePosVenda clientes={clientes} />)
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
  })

  it('filters by name search', async () => {
    render(<ClienteTablePosVenda clientes={clientes} />)
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'Ana')
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.queryByText('Bruno Costa')).not.toBeInTheDocument()
  })

  it('renders formatted valor_plano', () => {
    render(<ClienteTablePosVenda clientes={clientes} />)
    expect(screen.getByText(/350,00/)).toBeInTheDocument()
  })

  it('shows dash for missing email', () => {
    render(<ClienteTablePosVenda clientes={clientes} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows empty message when no match', async () => {
    render(<ClienteTablePosVenda clientes={clientes} />)
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'XXXXXXXXXXX')
    expect(screen.getByText(/nenhum cliente encontrado/i)).toBeInTheDocument()
  })
})
