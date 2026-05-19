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
  { id: '1', nome: 'Ana Lima',    telefone: null, tipo_plano: null,    operadora: null, responsavel: null, origem: null, o_que_procura: null, observacoes: null, vendedor: null, etapa: 'Novo Lead',  criado_em: '' },
  { id: '2', nome: 'Bruno Costa', telefone: null, tipo_plano: 'Saúde', operadora: null, responsavel: null, origem: null, o_que_procura: null, observacoes: null, vendedor: null, etapa: 'Negociação', criado_em: '' },
]

describe('KanbanBoard', () => {
  it('renders all 6 stage columns in correct order', () => {
    render(<KanbanBoard leads={leads} />)
    expect(screen.getAllByText('Novo Lead')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Contato Feito')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Cotação')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Negociação')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Vendido')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Perdido')[0]).toBeInTheDocument()
  })

  it('does not render removed stages', () => {
    render(<KanbanBoard leads={leads} />)
    expect(screen.queryByText('Proposta Enviada')).not.toBeInTheDocument()
    expect(screen.queryByText('Fechado')).not.toBeInTheDocument()
  })

  it('shows lead cards', () => {
    render(<KanbanBoard leads={leads} />)
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
  })
})
