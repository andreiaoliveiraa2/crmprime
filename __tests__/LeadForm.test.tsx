import { render, screen, fireEvent } from '@testing-library/react'
import LeadForm from '@/components/LeadForm'
import { Lead } from '@/lib/types'

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

describe('LeadForm', () => {
  it('renders all form fields', () => {
    render(<LeadForm />)
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de plano/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/etapa/i)).toBeInTheDocument()
  })

  it('shows error when submitting without nome', async () => {
    render(<LeadForm />)
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByText('Nome é obrigatório')).toBeInTheDocument()
  })

  it('pre-fills fields when editing lead', () => {
    const lead: Lead = {
      id: '1',
      nome: 'Carlos Mendes',
      telefone: '(83) 98888-9999',
      tipo_plano: 'Saúde',
      operadora: null,
      responsavel: null,
      etapa: 'Cotação',
      criado_em: '',
    }
    render(<LeadForm lead={lead} />)
    expect(screen.getByDisplayValue('Carlos Mendes')).toBeInTheDocument()
    expect(screen.getByDisplayValue('(83) 98888-9999')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Proposta Enviada')).toBeInTheDocument()
  })

  it('shows save and cancel buttons', () => {
    render(<LeadForm />)
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })
})
