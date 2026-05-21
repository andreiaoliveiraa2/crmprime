import OperadoraForm from '@/components/OperadoraForm'
import Link from 'next/link'

export default function NovaOperadoraPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link href="/gestao/operadoras"
          className="text-xs font-medium hover:opacity-70 transition-opacity"
          style={{ color: '#9a918a' }}>
          ← Voltar para Operadoras
        </Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#2d1f4e' }}>Nova Operadora</h1>
      </div>
      <OperadoraForm />
    </div>
  )
}
