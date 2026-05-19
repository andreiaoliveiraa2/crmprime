import { render, screen, fireEvent } from '@testing-library/react'
import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'
import { Cliente } from '@/lib/types'

const mockVendedoresChain = {
  select: () => ({
    eq: () => ({
      order: () => Promise.resolve({ data: [], error: null }),
    }),
  }),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'vendedores') return mockVendedoresChain
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      }
    },
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

describe('ClienteFormPosVenda', () => {
  it('renders key form fields', () => {
    render(<ClienteFormPosVenda />)
    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de plano/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/valor do plano/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/observações/i)).toBeInTheDocument()
  })

  it('shows error when nome is missing', async () => {
    render(<ClienteFormPosVenda />)
    fireEvent.click(screen.getByRole('button', { name: /cadastrar cliente/i }))
    expect(await screen.findByText('Nome é obrigatório.')).toBeInTheDocument()
  })

  it('pre-fills fields when editing', () => {
    const cliente: Cliente = {
      id: '1', nome: 'Maria Souza', contato: '(83) 99999-9999', email: 'maria@email.com',
      tipo_plano: 'Saúde', operadora: null, quantidade_vidas: null, valor_plano: 350,
      observacoes: 'Cliente VIP', lead_id: null, criado_em: '',
      cpf: null, data_nascimento: null, endereco: null, administradora: null,
      numero_contrato: null, data_venda: null, data_implantacao: null,
      status: 'Ativo', vendedor: null, comissao: null,
    }
    render(<ClienteFormPosVenda cliente={cliente} />)
    expect(screen.getByDisplayValue('Maria Souza')).toBeInTheDocument()
    expect(screen.getByDisplayValue('maria@email.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('350')).toBeInTheDocument()
  })
})
