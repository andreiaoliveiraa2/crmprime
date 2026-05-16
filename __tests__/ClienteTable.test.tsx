import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClienteTable from '@/components/ClienteTable'
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
  { id: '1', nome: 'Ana Lima', contato: 'ana@email.com', data: null, etapa: 'Lead', criado_em: '' },
  { id: '2', nome: 'Bruno Costa', contato: null, data: null, etapa: 'Proposta', criado_em: '' },
]

describe('ClienteTable', () => {
  it('renders all clients by default', () => {
    render(<ClienteTable clientes={clientes} />)
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
  })

  it('filters by pipeline stage', async () => {
    render(<ClienteTable clientes={clientes} />)
    await userEvent.click(screen.getByRole('button', { name: 'Lead' }))
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.queryByText('Bruno Costa')).not.toBeInTheDocument()
  })

  it('shows empty message when no clients match filter', async () => {
    render(<ClienteTable clientes={clientes} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fechado' }))
    expect(screen.getByText(/nenhum cliente encontrado/i)).toBeInTheDocument()
  })

  it('shows dash for missing contact', () => {
    render(<ClienteTable clientes={clientes} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
