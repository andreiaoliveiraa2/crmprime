import { render, screen } from '@testing-library/react'
import RenovacoesProximas from '@/components/RenovacoesProximas'
import { Cliente } from '@/lib/types'

function makeCliente(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: '1',
    nome: 'João Silva',
    contato: 'joao@email.com',
    data: null,
    etapa: 'Lead',
    criado_em: new Date().toISOString(),
    ...overrides,
  }
}

function dataRelativa(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().split('T')[0]
}

describe('RenovacoesProximas', () => {
  it('shows empty message when no clients', () => {
    render(<RenovacoesProximas clientes={[]} />)
    expect(screen.getByText(/nenhuma renovação/i)).toBeInTheDocument()
  })

  it('shows client with renewal in next 30 days', () => {
    const cliente = makeCliente({ data: dataRelativa(15) })
    render(<RenovacoesProximas clientes={[cliente]} />)
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })

  it('does not show client with past date', () => {
    const cliente = makeCliente({ data: dataRelativa(-1) })
    render(<RenovacoesProximas clientes={[cliente]} />)
    expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
  })

  it('does not show client with date beyond 30 days', () => {
    const cliente = makeCliente({ data: dataRelativa(31) })
    render(<RenovacoesProximas clientes={[cliente]} />)
    expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
  })

  it('does not show client with null date', () => {
    const cliente = makeCliente({ data: null })
    render(<RenovacoesProximas clientes={[cliente]} />)
    expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
  })
})
