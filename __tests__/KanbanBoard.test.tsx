import { render, screen } from '@testing-library/react'
import KanbanBoard from '@/components/KanbanBoard'
import { Lead } from '@/lib/types'

jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Droppable: ({ children }: { children: (p: any, s: any) => React.ReactNode }) =>
    children(
      { innerRef: jest.fn(), droppableProps: {}, placeholder: null },
      { isDraggingOver: false }
    ),
  Draggable: ({ children }: { children: (p: any, s: any) => React.ReactNode }) =>
    children(
      { innerRef: jest.fn(), draggableProps: { style: {} }, dragHandleProps: {} },
      { isDragging: false }
    ),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      update: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
    }),
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

const leads: Lead[] = [
  {
    id: '1', nome: 'Ana Lima', telefone: null, tipo_plano: null,
    operadora: null, responsavel: null, origem: null, o_que_procura: null,
    observacoes: null, vendedor: null, vendedor_id: null,
    etapa: 'Novo Lead', criado_em: '', atualizado_em: '',
  },
  {
    id: '2', nome: 'Bruno Costa', telefone: null, tipo_plano: 'Saúde',
    operadora: null, responsavel: null, origem: null, o_que_procura: null,
    observacoes: null, vendedor: null, vendedor_id: null,
    etapa: 'Negociação', criado_em: '', atualizado_em: '',
  },
]

describe('KanbanBoard', () => {
  it('renders all 6 stage columns in correct order', () => {
    render(<KanbanBoard leads={leads} onLeadMoved={jest.fn()} />)
    expect(screen.getAllByText('Novo Lead')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Contato Feito')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Cotação')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Negociação')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Vendido')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Perdido')[0]).toBeInTheDocument()
  })

  it('does not render removed stages', () => {
    render(<KanbanBoard leads={leads} onLeadMoved={jest.fn()} />)
    expect(screen.queryByText('Proposta Enviada')).not.toBeInTheDocument()
    expect(screen.queryByText('Fechado')).not.toBeInTheDocument()
  })

  it('shows lead cards', () => {
    render(<KanbanBoard leads={leads} onLeadMoved={jest.fn()} />)
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
  })

  it('exibe badge de parado em lead com 5+ dias sem movimentação', () => {
    const leadParado: Lead = {
      id: '3', nome: 'Carlos Dias', telefone: null, tipo_plano: null,
      operadora: null, responsavel: null, origem: null, o_que_procura: null,
      observacoes: null, vendedor: null, vendedor_id: null,
      etapa: 'Cotação', criado_em: '',
      atualizado_em: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    }
    render(<KanbanBoard leads={[leadParado]} onLeadMoved={jest.fn()} />)
    expect(screen.getByText(/6 dias/i)).toBeInTheDocument()
  })

  it('não exibe badge em lead atualizado recentemente', () => {
    const leadAtivo: Lead = {
      id: '4', nome: 'Daniela Melo', telefone: null, tipo_plano: null,
      operadora: null, responsavel: null, origem: null, o_que_procura: null,
      observacoes: null, vendedor: null, vendedor_id: null,
      etapa: 'Cotação', criado_em: '',
      atualizado_em: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    }
    render(<KanbanBoard leads={[leadAtivo]} onLeadMoved={jest.fn()} />)
    expect(screen.queryByText(/dias/i)).not.toBeInTheDocument()
  })
})
