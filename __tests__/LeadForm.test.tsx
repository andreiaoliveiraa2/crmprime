import { render, screen, fireEvent } from '@testing-library/react'
import LeadForm from '@/components/LeadForm'
import { Lead } from '@/lib/types'

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

describe('LeadForm', () => {
  it('renders core form fields', () => {
    render(<LeadForm />)
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de plano/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/operadora/i)).toBeInTheDocument()
  })

  it('shows error when submitting without nome or telefone', async () => {
    render(<LeadForm />)
    fireEvent.click(screen.getByRole('button', { name: /cadastrar lead/i }))
    expect(await screen.findByText('Informe pelo menos o nome ou o telefone.')).toBeInTheDocument()
  })

  it('pre-fills fields when editing lead', () => {
    const lead: Lead = {
      id: '1',
      nome: 'Carlos Mendes',
      telefone: '(83) 98888-9999',
      tipo_plano: 'Familiar',
      operadora: 'Unimed',
      responsavel: null,
      origem: null,
      o_que_procura: null,
      observacoes: null,
      etapa: 'Cotação',
      criado_em: '2026-01-01T00:00:00Z',
    }
    render(<LeadForm lead={lead} />)
    expect(screen.getByDisplayValue('Carlos Mendes')).toBeInTheDocument()
    expect(screen.getByDisplayValue('(83) 98888-9999')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Unimed')).toBeInTheDocument()
  })

  it('shows save and cancel buttons', () => {
    render(<LeadForm />)
    expect(screen.getByRole('button', { name: /cadastrar lead/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })
})
