'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Vendedor,
  VendedorInsert,
  TIPOS_VENDEDOR,
  CORRETORAS_VENDEDOR,
  NIVEIS_VENDEDOR,
} from '@/lib/types'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  vendedor?: Vendedor
}

const inputCls =
  'w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-shadow'
const inputStyle = { borderColor: '#e8e4dd' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: '#2d1f4e' }

function Secao({
  titulo,
  index,
  aberta,
  onToggle,
  children,
}: {
  titulo: string
  index: number
  aberta: boolean
  onToggle: (i: number) => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #e8e4dd' }}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        onClick={() => onToggle(index)}
      >
        <span className="text-sm font-bold" style={{ color: '#2d1f4e' }}>{titulo}</span>
        {aberta
          ? <ChevronUp size={16} style={{ color: '#2d1f4e' }} />
          : <ChevronDown size={16} style={{ color: '#9a918a' }} />
        }
      </button>
      {aberta && (
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {children}
        </div>
      )}
    </div>
  )
}

export default function VendedorForm({ vendedor }: Props) {
  const editando = !!vendedor

  // Dados pessoais
  const [nome, setNome]                               = useState(vendedor?.nome ?? '')
  const [cpfCnpj, setCpfCnpj]                         = useState(vendedor?.cpf_cnpj ?? '')
  const [rg, setRg]                                   = useState(vendedor?.rg ?? '')
  const [dataNascimento, setDataNascimento]           = useState(vendedor?.data_nascimento ?? '')
  const [sexo, setSexo]                               = useState(vendedor?.sexo ?? '')
  const [telefone, setTelefone]                       = useState(vendedor?.telefone ?? '')
  const [email, setEmail]                             = useState(vendedor?.email ?? '')
  const [enderecoCep, setEnderecoCep]                 = useState(vendedor?.endereco_cep ?? '')
  const [enderecoLogradouro, setEnderecoLogradouro]   = useState(vendedor?.endereco_logradouro ?? '')
  const [enderecoNumero, setEnderecoNumero]           = useState(vendedor?.endereco_numero ?? '')
  const [enderecoComplemento, setEnderecoComplemento] = useState(vendedor?.endereco_complemento ?? '')
  const [enderecoBairro, setEnderecoBairro]           = useState(vendedor?.endereco_bairro ?? '')
  const [enderecoCidade, setEnderecoCidade]           = useState(vendedor?.endereco_cidade ?? '')
  const [enderecoEstado, setEnderecoEstado]           = useState(vendedor?.endereco_estado ?? '')

  // Dados profissionais
  const [tipo, setTipo]                 = useState(vendedor?.tipo ?? '')
  const [corretora, setCorretora]       = useState(vendedor?.corretora ?? '')
  const [nivel, setNivel]               = useState(vendedor?.nivel ?? '')
  const [dataAdmissao, setDataAdmissao] = useState(vendedor?.data_admissao ?? '')
  const [dataDemissao, setDataDemissao] = useState(vendedor?.data_demissao ?? '')
  const [susep, setSusep]               = useState(vendedor?.susep ?? '')
  const [ativo, setAtivo]               = useState(vendedor?.ativo ?? true)

  // Informações bancárias
  const [banco, setBanco]         = useState(vendedor?.banco ?? '')
  const [agencia, setAgencia]     = useState(vendedor?.agencia ?? '')
  const [conta, setConta]         = useState(vendedor?.conta ?? '')
  const [tipoConta, setTipoConta] = useState(vendedor?.tipo_conta ?? '')
  const [pix, setPix]             = useState(vendedor?.pix ?? '')

  // Observações
  const [observacoes, setObservacoes] = useState(vendedor?.observacoes ?? '')

  // UI
  const [secaoAberta, setSecaoAberta] = useState(0)
  const [erro, setErro]               = useState('')
  const [loading, setLoading]         = useState(false)

  const router = useRouter()
  const supabase = createClient()

  function toggleSecao(i: number) {
    setSecaoAberta(prev => (prev === i ? -1 : i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setErro('Nome é obrigatório'); return }
    setLoading(true)
    setErro('')

    const payload: VendedorInsert = {
      nome:                  nome.trim(),
      ativo,
      cpf_cnpj:              cpfCnpj || null,
      rg:                    rg || null,
      data_nascimento:       dataNascimento || null,
      sexo:                  sexo || null,
      telefone:              telefone || null,
      email:                 email || null,
      endereco_cep:          enderecoCep || null,
      endereco_logradouro:   enderecoLogradouro || null,
      endereco_numero:       enderecoNumero || null,
      endereco_complemento:  enderecoComplemento || null,
      endereco_bairro:       enderecoBairro || null,
      endereco_cidade:       enderecoCidade || null,
      endereco_estado:       enderecoEstado || null,
      tipo:                  tipo || null,
      corretora:             corretora || null,
      nivel:                 nivel || null,
      data_admissao:         dataAdmissao || null,
      data_demissao:         dataDemissao || null,
      susep:                 susep || null,
      banco:                 banco || null,
      agencia:               agencia || null,
      conta:                 conta || null,
      tipo_conta:            tipoConta || null,
      pix:                   pix || null,
      observacoes:           observacoes || null,
    }

    const { error } = editando
      ? await supabase.from('vendedores').update(payload).eq('id', vendedor!.id)
      : await supabase.from('vendedores').insert(payload)

    if (error) {
      setErro('Erro ao salvar: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/gestao')
    router.refresh()
  }

  const secaoProps = (i: number) => ({ index: i, aberta: secaoAberta === i, onToggle: toggleSecao })

  return (
    <form onSubmit={handleSubmit}>
      <Secao titulo="Dados Pessoais" {...secaoProps(0)}>
        <div className="md:col-span-2">
          <label className={labelCls} style={labelStyle}>Nome completo *</label>
          <input
            className={inputCls}
            style={inputStyle}
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>CPF / CNPJ</label>
          <input className={inputCls} style={inputStyle} value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>RG</label>
          <input className={inputCls} style={inputStyle} value={rg} onChange={e => setRg(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Data de nascimento</label>
          <input type="date" className={inputCls} style={inputStyle} value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Sexo</label>
          <select className={inputCls} style={inputStyle} value={sexo} onChange={e => setSexo(e.target.value)}>
            <option value="">Selecione</option>
            <option>Masculino</option>
            <option>Feminino</option>
            <option>Outro</option>
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Telefone / WhatsApp</label>
          <input className={inputCls} style={inputStyle} value={telefone} onChange={e => setTelefone(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>E-mail</label>
          <input type="email" className={inputCls} style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>CEP</label>
          <input className={inputCls} style={inputStyle} value={enderecoCep} onChange={e => setEnderecoCep(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} style={labelStyle}>Logradouro</label>
          <input className={inputCls} style={inputStyle} value={enderecoLogradouro} onChange={e => setEnderecoLogradouro(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Número</label>
          <input className={inputCls} style={inputStyle} value={enderecoNumero} onChange={e => setEnderecoNumero(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Complemento</label>
          <input className={inputCls} style={inputStyle} value={enderecoComplemento} onChange={e => setEnderecoComplemento(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Bairro</label>
          <input className={inputCls} style={inputStyle} value={enderecoBairro} onChange={e => setEnderecoBairro(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Cidade</label>
          <input className={inputCls} style={inputStyle} value={enderecoCidade} onChange={e => setEnderecoCidade(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Estado (UF)</label>
          <input className={inputCls} style={inputStyle} value={enderecoEstado} onChange={e => setEnderecoEstado(e.target.value)} maxLength={2} placeholder="SP" />
        </div>
      </Secao>

      <Secao titulo="Dados Profissionais" {...secaoProps(1)}>
        <div>
          <label className={labelCls} style={labelStyle}>Tipo</label>
          <select className={inputCls} style={inputStyle} value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="">Selecione</option>
            {TIPOS_VENDEDOR.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Corretora vinculada</label>
          <select className={inputCls} style={inputStyle} value={corretora} onChange={e => setCorretora(e.target.value)}>
            <option value="">Selecione</option>
            {CORRETORAS_VENDEDOR.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Nível</label>
          <select className={inputCls} style={inputStyle} value={nivel} onChange={e => setNivel(e.target.value)}>
            <option value="">Selecione</option>
            {NIVEIS_VENDEDOR.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Status</label>
          <select
            className={inputCls}
            style={inputStyle}
            value={ativo ? 'ativo' : 'inativo'}
            onChange={e => setAtivo(e.target.value === 'ativo')}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Data de admissão</label>
          <input type="date" className={inputCls} style={inputStyle} value={dataAdmissao} onChange={e => setDataAdmissao(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Data de demissão</label>
          <input type="date" className={inputCls} style={inputStyle} value={dataDemissao} onChange={e => setDataDemissao(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} style={labelStyle}>SUSEP</label>
          <input className={inputCls} style={inputStyle} value={susep} onChange={e => setSusep(e.target.value)} />
        </div>
      </Secao>

      <Secao titulo="Informações Bancárias" {...secaoProps(2)}>
        <div>
          <label className={labelCls} style={labelStyle}>Banco</label>
          <input className={inputCls} style={inputStyle} value={banco} onChange={e => setBanco(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Agência</label>
          <input className={inputCls} style={inputStyle} value={agencia} onChange={e => setAgencia(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Conta</label>
          <input className={inputCls} style={inputStyle} value={conta} onChange={e => setConta(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Tipo de conta</label>
          <select className={inputCls} style={inputStyle} value={tipoConta} onChange={e => setTipoConta(e.target.value)}>
            <option value="">Selecione</option>
            <option>Corrente</option>
            <option>Poupança</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} style={labelStyle}>PIX</label>
          <input className={inputCls} style={inputStyle} value={pix} onChange={e => setPix(e.target.value)} />
        </div>
      </Secao>

      <Secao titulo="Observações" {...secaoProps(3)}>
        <div className="md:col-span-2">
          <textarea
            className={inputCls}
            style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            placeholder="Anotações sobre este vendedor..."
          />
        </div>
      </Secao>

      {erro && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
        >
          {erro}
        </div>
      )}

      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push('/gestao')}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: '#e8e4dd', color: '#4a4a4a' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#2d1f4e' }}
        >
          {loading ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar vendedor'}
        </button>
      </div>
    </form>
  )
}
