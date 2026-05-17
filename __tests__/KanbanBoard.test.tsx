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
      { innerRef: jest.fn(), draggableProps: {}, dragHandleProps: {} },
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
  { id: '1', nome: 'Ana Lima', telefone: null, tipo_plano: null, etapa: 'Novo Lead', criado_em: '' },
  { id: '2', nome: 'Bruno Costa', telefone: null, tipo_plano: 'Saúde', etapa: 'Negociação', criado_em: '' },
]

describe('KanbanBoard', () => {
  it('renders all 6 stage columns', () => {
    render(<KanbanBoard leads={leads} />)
    expect(screen.getByText('Novo Lead')).toBeInTheDocument()
    expect(screen.getByText('Contato Feito')).toBeInTheDocument()
    expect(screen.getByText('Proposta Enviada')).toBeInTheDocument()
    expect(screen.getByText('Negociação')).toBeInTheDocument()
    expect(screen.getByText('Fechado')).toBeInTheDocument()
    expect(screen.getByText('Perdido')).toBeInTheDocument()
  })

  it('shows lead cards', () => {
    render(<KanbanBoard leads={leads} />)
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
  })
})
