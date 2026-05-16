import ClienteForm from '@/components/ClienteForm'

export default function NovoClientePage() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Cliente</h1>
      <ClienteForm />
    </div>
  )
}
