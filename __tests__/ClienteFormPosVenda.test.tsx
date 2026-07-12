import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'
import { Cliente } from '@/lib/types'

jest.mock('@/lib/useOperadoras', () => ({ useOperadoras: () => [] }))

const mockVendedoresChain = {
  select: () => ({
    eq: () => ({
      order: () => Promise.resolve({ data: [], error: null }),
    }),
  }),
}

const mockUpdatePayload = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'vendedores') return mockVendedoresChain
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: (payload: object) => {
          mockUpdatePayload(payload)
          return { eq: jest.fn().mockResolvedValue({ error: null }) }
        },
        select: () => ({
          eq: () => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: { fase_cliente: 'ativo' }, error: null }),
            order: () => ({
              limit: () => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }
    },
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

describe('ClienteFormPosVenda', () => {
  const clienteBase: Cliente = {
    id: '1', nome: 'Maria Souza', contato: '(83) 99999-9999', email: 'maria@email.com',
    tipo_plano: 'Saúde', operadora: null, quantidade_vidas: null, valor_plano: 350,
    observacoes: 'Cliente VIP', lead_id: null, criado_em: '',
    cpf: null, data_nascimento: null, endereco: null, administradora: null,
    numero_contrato: null, data_venda: null, data_implantacao: null,
    status: 'Ativo', vendedor: null, comissao: null,
  } as Cliente

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
    render(<ClienteFormPosVenda cliente={clienteBase} />)
    expect(screen.getByDisplayValue('Maria Souza')).toBeInTheDocument()
    expect(screen.getByDisplayValue('maria@email.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('350')).toBeInTheDocument()
  })

  it('admin (default) vê a seção Fase do Cliente com o botão Vitalício', () => {
    render(<ClienteFormPosVenda cliente={clienteBase} />)
    expect(screen.getByText('Fase do Cliente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vitalício' })).toBeInTheDocument()
  })

  it('mostrarVitalicio=false não menciona vitalício em lugar nenhum', () => {
    render(<ClienteFormPosVenda cliente={clienteBase} mostrarVitalicio={false} />)
    expect(screen.queryByText('Fase do Cliente')).not.toBeInTheDocument()
    expect(screen.queryByText(/vital/i)).not.toBeInTheDocument()
  })

  it('mostrarVitalicio=false salva sem as chaves de fase/vitalício/comissão', async () => {
    mockUpdatePayload.mockClear()
    render(<ClienteFormPosVenda cliente={clienteBase} mostrarVitalicio={false} />)
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))
    await waitFor(() => expect(mockUpdatePayload).toHaveBeenCalled())
    const payload = mockUpdatePayload.mock.calls[0][0]
    expect(payload).toHaveProperty('nome', 'Maria Souza')
    expect(payload).not.toHaveProperty('fase_cliente')
    expect(payload).not.toHaveProperty('vitalicio_valor_estimado')
    expect(payload).not.toHaveProperty('vitalicio_dia_previsto')
    expect(payload).not.toHaveProperty('vitalicio_inicio')
    expect(payload).not.toHaveProperty('comissao')
  })

  it('default (admin) salva COM as chaves de fase/vitalício', async () => {
    mockUpdatePayload.mockClear()
    render(<ClienteFormPosVenda cliente={clienteBase} />)
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))
    await waitFor(() => expect(mockUpdatePayload).toHaveBeenCalled())
    const payload = mockUpdatePayload.mock.calls[0][0]
    expect(payload).toHaveProperty('fase_cliente', 'ativo')
    expect(payload).toHaveProperty('comissao', null)
  })
})
