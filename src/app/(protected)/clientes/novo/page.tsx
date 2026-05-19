import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'

export default function NovoClientePage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Novo Cliente</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>Cadastre um cliente com plano ativo</p>
      </div>
      <ClienteFormPosVenda />
    </div>
  )
}
