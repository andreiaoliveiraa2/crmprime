import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CrmTabs from '@/components/CrmTabs'

jest.mock('@/components/ClienteTable', () => ({
  __esModule: true,
  default: () => <div data-testid="cliente-table">Tabela</div>,
}))

jest.mock('@/components/KanbanBoard', () => ({
  __esModule: true,
  default: () => <div data-testid="kanban-board">Kanban</div>,
}))

describe('CrmTabs', () => {
  it('shows table by default', () => {
    render(<CrmTabs clientes={[]} />)
    expect(screen.getByTestId('cliente-table')).toBeInTheDocument()
    expect(screen.queryByTestId('kanban-board')).not.toBeInTheDocument()
  })

  it('switches to kanban when tab clicked', async () => {
    render(<CrmTabs clientes={[]} />)
    await userEvent.click(screen.getByRole('button', { name: /kanban/i }))
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-table')).not.toBeInTheDocument()
  })

  it('renders both tab buttons', () => {
    render(<CrmTabs clientes={[]} />)
    expect(screen.getByRole('button', { name: /lista/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /kanban/i })).toBeInTheDocument()
  })
})
