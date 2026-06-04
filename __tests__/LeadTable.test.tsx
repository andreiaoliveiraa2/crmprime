import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LeadTable from '@/components/LeadTable'
import { Lead } from '@/lib/types'

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

const leads: Lead[] = [
  {
    id: '1', nome: 'Ana Lima', telefone: '(83) 99999-1111', tipo_plano: 'Saúde',
    operadora: null, responsavel: null, origem: null, o_que_procura: null,
    observacoes: null, vendedor: null, vendedor_id: null,
    etapa: 'Novo Lead', criado_em: '', atualizado_em: '',
  },
  {
    id: '2', nome: 'Bruno Costa', telefone: null, tipo_plano: 'Odonto',
    operadora: null, responsavel: null, origem: null, o_que_procura: null,
    observacoes: null, vendedor: null, vendedor_id: null,
    etapa: 'Negociação', criado_em: '', atualizado_em: '',
  },
]

describe('LeadTable', () => {
  it('renders all leads by default', () => {
    render(<LeadTable leads={leads} />)
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
  })

  it('filters by name search', async () => {
    render(<LeadTable leads={leads} />)
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), 'Ana')
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.queryByText('Bruno Costa')).not.toBeInTheDocument()
  })

  it('filters by pipeline stage', async () => {
    render(<LeadTable leads={leads} />)
    await userEvent.click(screen.getByRole('button', { name: 'Negociação' }))
    expect(screen.queryByText('Ana Lima')).not.toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
  })

  it('shows dash for missing phone', () => {
    render(<LeadTable leads={leads} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows empty message when no leads match', async () => {
    render(<LeadTable leads={leads} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cotação' }))
    expect(screen.getByText(/nenhum lead encontrado/i)).toBeInTheDocument()
  })

  it('exibe badge de parado ao lado do nome quando >= 5 dias', () => {
    const leadParado: Lead = {
      id: '3', nome: 'Eva Souza', telefone: null, tipo_plano: null,
      operadora: null, responsavel: null, origem: null, o_que_procura: null,
      observacoes: null, vendedor: null, vendedor_id: null,
      etapa: 'Cotação', criado_em: '',
      atualizado_em: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    }
    render(<LeadTable leads={[leadParado]} />)
    expect(screen.getByText(/7 dias/i)).toBeInTheDocument()
  })

  it('não exibe badge em lead recente', () => {
    const leadAtivo: Lead = {
      id: '4', nome: 'Fábio Torres', telefone: null, tipo_plano: null,
      operadora: null, responsavel: null, origem: null, o_que_procura: null,
      observacoes: null, vendedor: null, vendedor_id: null,
      etapa: 'Cotação', criado_em: '',
      atualizado_em: new Date(Date.now() - 1 * 86_400_000).toISOString(),
    }
    render(<LeadTable leads={[leadAtivo]} />)
    expect(screen.queryByText(/dias/i)).not.toBeInTheDocument()
  })
})
