import VendedorForm from '@/components/VendedorForm'

export default function NovoVendedorPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2d1f4e' }}>Novo Vendedor</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9a918a' }}>
          Cadastre um vendedor ou corretor
        </p>
      </div>
      <VendedorForm />
    </div>
  )
}
