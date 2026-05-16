import { render, screen } from '@testing-library/react'
import KanbanBoard from '@/components/KanbanBoard'
import { Cliente } from '@/lib/types'

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

const clientes: Cliente[] = [
  { id: '1', nome: 'Ana Lima', contato: null, data: null, etapa: 'Lead', criado_em: '' },
  { id: '2', nome: 'Bruno Costa', contato: null, data: null, etapa: 'Proposta', criado_em: '' },
]

describe('KanbanBoard', () => {
  it('renders all 5 stage columns', () => {
    render(<KanbanBoard clientes={clientes} />)
    expect(screen.getByText('Lead')).toBeInTheDocument()
    expect(screen.getByText('Contato')).toBeInTheDocument()
    expect(screen.getByText('Proposta')).toBeInTheDocument()
    expect(screen.getByText('Fechado')).toBeInTheDocument()
    expect(screen.getByText('Perdido')).toBeInTheDocument()
  })

  it('shows client cards in correct columns', () => {
    render(<KanbanBoard clientes={clientes} />)
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
  })
})
