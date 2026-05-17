import ClienteFormPosVenda from '@/components/ClienteFormPosVenda'

export default function NovoClientePage() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Novo Cliente</h1>
      <p className="text-sm text-stone-500 mb-6">Cadastre um cliente com plano ativo</p>
      <ClienteFormPosVenda />
    </div>
  )
}
