import { render, screen } from '@testing-library/react'
import Sidebar from '@/components/Sidebar'

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}))

describe('Sidebar', () => {
  it('renders navigation links', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('CRM')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(<Sidebar />)
    expect(screen.getByText('Sair')).toBeInTheDocument()
  })

  it('highlights active link', () => {
    render(<Sidebar />)
    const link = screen.getByText('Dashboard').closest('a')
    expect(link).toHaveClass('text-blue-700')
  })
})
