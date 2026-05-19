import { render, screen, fireEvent } from '@testing-library/react'
import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'
import { Cliente } from '@/lib/types'

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
    }),
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

describe('ClienteFormPosVenda', () => {
  it('renders all form fields', () => {
    render(<ClienteFormPosVenda />)
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de plano/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/valor do plano/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/observações/i)).toBeInTheDocument()
  })

  it('shows error when nome is missing', async () => {
    render(<ClienteFormPosVenda />)
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByText('Nome é obrigatório')).toBeInTheDocument()
  })

  it('shows error when valor is missing', async () => {
    render(<ClienteFormPosVenda />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'João' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByText('Valor do plano é obrigatório')).toBeInTheDocument()
  })

  it('pre-fills fields when editing', () => {
    const cliente: Cliente = {
      id: '1', nome: 'Maria Souza', contato: '(83) 99999-9999', email: 'maria@email.com',
      tipo_plano: 'Saúde', operadora: null, quantidade_vidas: null, valor_plano: 350, observacoes: 'Cliente VIP', lead_id: null, criado_em: '',
    }
    render(<ClienteFormPosVenda cliente={cliente} />)
    expect(screen.getByDisplayValue('Maria Souza')).toBeInTheDocument()
    expect(screen.getByDisplayValue('maria@email.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('350')).toBeInTheDocument()
  })
})
