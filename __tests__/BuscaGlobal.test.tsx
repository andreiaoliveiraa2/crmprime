import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BuscaGlobal from '@/components/BuscaGlobal'

const mockLeads = [
  { id: 'l1', nome: 'Ana Lima',    telefone: '(83) 99999-1111' },
  { id: 'l2', nome: 'Bruno Costa', telefone: null },
]
const mockClientes = [
  { id: 'c1', nome: 'Carlos Dias', contato: '(83) 88888-0000', cpf: '123.456.789-00' },
]

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: (_fields: string) => Promise.resolve({
        data: table === 'leads' ? mockLeads : mockClientes,
        error: null,
      }),
    }),
  }),
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('BuscaGlobal', () => {
  beforeEach(() => mockPush.mockClear())

  it('renders trigger button', () => {
    render(<BuscaGlobal />)
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument()
  })

  it('opens modal when trigger is clicked', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    expect(screen.getByPlaceholderText(/buscar leads e clientes/i)).toBeInTheDocument()
  })

  it('shows no results for less than 2 chars', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'A')
    expect(screen.queryByText('Ana Lima')).not.toBeInTheDocument()
  })

  it('shows matching leads when 2+ chars typed', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'Ana')
    await waitFor(() => expect(screen.getByText('Ana Lima')).toBeInTheDocument())
    expect(screen.queryByText('Bruno Costa')).not.toBeInTheDocument()
  })

  it('shows matching clientes when 2+ chars typed', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'Carlos')
    await waitFor(() => expect(screen.getByText('Carlos Dias')).toBeInTheDocument())
  })

  it('shows empty state when no results match', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'xyz')
    await waitFor(() => expect(screen.getByText(/nenhum resultado/i)).toBeInTheDocument())
  })

  it('navigates to lead page on result click', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'Ana')
    await waitFor(() => screen.getByText('Ana Lima'))
    await userEvent.click(screen.getByText('Ana Lima'))
    expect(mockPush).toHaveBeenCalledWith('/crm/l1')
  })

  it('navigates to cliente page on result click', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'Carlos')
    await waitFor(() => screen.getByText('Carlos Dias'))
    await userEvent.click(screen.getByText('Carlos Dias'))
    expect(mockPush).toHaveBeenCalledWith('/clientes/c1')
  })

  it('closes modal on Escape key', async () => {
    render(<BuscaGlobal />)
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }))
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByPlaceholderText(/buscar/i)).not.toBeInTheDocument()
  })
})
