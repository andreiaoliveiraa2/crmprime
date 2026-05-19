import { render, screen, fireEvent } from '@testing-library/react'
import ConversaoModal from '@/components/ConversaoModal'
import { Lead } from '@/lib/types'

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

const lead: Lead = {
  id: '1',
  nome: 'Maria Silva',
  telefone: '(83) 99999-0000',
  tipo_plano: 'Saúde',
  operadora: null,
  responsavel: null,
  origem: null,
  o_que_procura: null,
  observacoes: null,
  etapa: 'Vendido',
  criado_em: '',
}

describe('ConversaoModal', () => {
  it('renders lead name pre-filled', () => {
    render(<ConversaoModal lead={lead} onClose={jest.fn()} onCancelar={jest.fn()} />)
    expect(screen.getByDisplayValue('Maria Silva')).toBeInTheDocument()
  })

  it('renders all required fields', () => {
    render(<ConversaoModal lead={lead} onClose={jest.fn()} onCancelar={jest.fn()} />)
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/valor do plano/i)).toBeInTheDocument()
  })

  it('shows error when valor is missing', async () => {
    render(<ConversaoModal lead={lead} onClose={jest.fn()} onCancelar={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /salvar como cliente/i }))
    expect(await screen.findByText(/informe um valor válido/i)).toBeInTheDocument()
  })

  it('calls onCancelar when cancel is clicked', () => {
    const onCancelar = jest.fn()
    render(<ConversaoModal lead={lead} onClose={jest.fn()} onCancelar={onCancelar} />)
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancelar).toHaveBeenCalled()
  })
})
