import { render, screen } from '@testing-library/react'
import FichaClientePage from '@/app/(protected)/clientes/[id]/page'
import { getUsuarioAtual } from '@/lib/getUsuarioAtual'

jest.mock('@/lib/getUsuarioAtual', () => ({
  getUsuarioAtual: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              id: '1', nome: 'Maria Souza', status: 'Ativo', comissao: 150,
              observacoes: 'Controle de estorno: ver extrato',
              cpf: null, data_nascimento: null, contato: null, email: null,
              endereco: null, operadora: 'Amil', administradora: null,
              tipo_plano: null, quantidade_vidas: null, valor_plano: 350,
              numero_contrato: null, data_venda: null, data_implantacao: null,
              vendedor: 'João', fase_cliente: 'vitalicio',
            },
            error: null,
          }),
        }),
      }),
    }),
  }),
}))

const mockGetUsuarioAtual = getUsuarioAtual as jest.Mock

const params = Promise.resolve({ id: '1' })

describe('FichaClientePage — campo Comissão por perfil', () => {
  it('admin vê o campo Comissão', async () => {
    mockGetUsuarioAtual.mockResolvedValue({ id: 'u1', auth_user_id: 'a1', nome: 'Andreia', perfil: 'admin', vendedor_id: null })
    render(await FichaClientePage({ params }))
    expect(screen.getByText('Comissão')).toBeInTheDocument()
    expect(screen.getByText('R$ 150,00')).toBeInTheDocument()
  })

  it('vendedor não vê o campo Comissão (mas vê Observações)', async () => {
    mockGetUsuarioAtual.mockResolvedValue({ id: 'u2', auth_user_id: 'a2', nome: 'João', perfil: 'vendedor', vendedor_id: 'v1' })
    render(await FichaClientePage({ params }))
    expect(screen.queryByText('Comissão')).not.toBeInTheDocument()
    expect(screen.queryByText('R$ 150,00')).not.toBeInTheDocument()
    expect(screen.getByText('Controle de estorno: ver extrato')).toBeInTheDocument()
  })

  it('sessão nula esconde a Comissão (mais restritivo)', async () => {
    mockGetUsuarioAtual.mockResolvedValue(null)
    render(await FichaClientePage({ params }))
    expect(screen.queryByText('Comissão')).not.toBeInTheDocument()
  })
})
