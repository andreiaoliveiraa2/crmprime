import { render, screen, fireEvent } from '@testing-library/react'
import ClienteForm from '@/components/ClienteForm'
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

describe('ClienteForm', () => {
  it('renders all form fields', () => {
    render(<ClienteForm />)
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contato/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/data/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/etapa/i)).toBeInTheDocument()
  })

  it('shows error when submitting without nome', async () => {
    render(<ClienteForm />)
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByText('Nome é obrigatório')).toBeInTheDocument()
  })

  it('pre-fills fields when editing existing client', () => {
    const cliente: Cliente = {
      id: '1',
      nome: 'Maria Souza',
      contato: '(83) 99999-9999',
      data: '2026-08-01',
      etapa: 'Proposta',
      criado_em: '',
    }
    render(<ClienteForm cliente={cliente} />)
    expect(screen.getByDisplayValue('Maria Souza')).toBeInTheDocument()
    expect(screen.getByDisplayValue('(83) 99999-9999')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Proposta')).toBeInTheDocument()
  })

  it('shows save and cancel buttons', () => {
    render(<ClienteForm />)
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })
})
