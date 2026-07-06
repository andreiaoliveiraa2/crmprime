'use client'

import { useState } from 'react'
import { Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { salvarGoogleIcalUrl, testarGoogleIcal } from '@/app/actions/integracoes'

export default function IntegracaoAgendaCard({ urlAtual }: { urlAtual: string }) {
  const [url, setUrl] = useState(urlAtual)
  const [testando, setTestando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null)

  async function handleTestar() {
    setTestando(true); setResultado(null)
    const r = await testarGoogleIcal(url)
    setTestando(false)
    setResultado(r.ok
      ? { ok: true, msg: `Conectou! ${r.qtd} compromisso${r.qtd === 1 ? '' : 's'} encontrado${r.qtd === 1 ? '' : 's'} (últimos 30 + próximos 60 dias).` }
      : { ok: false, msg: r.erro ?? 'Não deu certo. Confira o link.' })
  }

  async function handleSalvar() {
    setSalvando(true); setResultado(null)
    const fd = new FormData(); fd.set('url', url)
    try {
      await salvarGoogleIcalUrl(fd)
      setResultado({ ok: true, msg: url.trim() ? 'Link salvo! Sua agenda vai aparecer na Agenda e no Meu Dia.' : 'Integração desligada (link removido).' })
    } catch {
      setResultado({ ok: false, msg: 'Erro ao salvar. Tente de novo.' })
    }
    setSalvando(false)
  }

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#e8e4dd' }}>
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(66,133,244,0.12)' }}>
          <Calendar size={16} style={{ color: '#4285F4' }} />
        </div>
        <h3 className="text-base font-semibold" style={{ color: '#2d1f4e' }}>Integração — Google Agenda</h3>
      </div>
      <p className="text-sm mb-4" style={{ color: '#7a7065' }}>
        Cole o <b>link secreto</b> da sua Google Agenda pra ver seus compromissos aqui no sistema (na Agenda e no Meu Dia). É só leitura — o sistema mostra, nunca altera sua agenda.
      </p>

      <label className="block text-sm font-medium mb-1" style={{ color: '#9a918a' }}>Endereço secreto no formato iCal</label>
      <input
        type="text"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
        style={{ border: '1px solid #e8e4dd' }}
      />

      <div className="flex items-center gap-2 mt-3">
        <button onClick={handleTestar} disabled={testando || salvando}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
          style={{ border: '1px solid #b89a6a', color: '#b89a6a', backgroundColor: '#fff' }}>
          {testando ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Testar
        </button>
        <button onClick={handleSalvar} disabled={salvando || testando}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#2d1f4e' }}>
          {salvando ? <Loader2 size={14} className="animate-spin" /> : null} Salvar
        </button>
      </div>

      {resultado && (
        <div className="flex items-start gap-2 mt-3 text-sm rounded-xl px-3 py-2"
          style={resultado.ok ? { backgroundColor: '#dcfce7', color: '#15803d' } : { backgroundColor: '#fee2e2', color: '#b91c1c' }}>
          {resultado.ok ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <AlertCircle size={15} className="mt-0.5 shrink-0" />}
          <span>{resultado.msg}</span>
        </div>
      )}

      <div className="mt-5 rounded-xl p-3 text-xs leading-relaxed" style={{ backgroundColor: '#faf8f5', border: '1px solid #f0ece6', color: '#5a4e3c' }}>
        <b style={{ color: '#2d1f4e' }}>Onde pegar o link (no computador):</b>
        <ol className="list-decimal ml-4 mt-1 space-y-0.5">
          <li>Abra <b>calendar.google.com</b></li>
          <li>Passe o mouse na sua agenda (em &ldquo;Minhas agendas&rdquo;) → clique nos <b>3 pontinhos</b> → <b>Configurações e compartilhamento</b></li>
          <li>Role até <b>Integrar agenda</b></li>
          <li>Copie o <b>&ldquo;Endereço secreto no formato iCal&rdquo;</b> (termina em .ics) e cole aqui</li>
        </ol>
        <p className="mt-1.5">🔒 Esse link é secreto — não compartilhe com ninguém.</p>
      </div>
    </div>
  )
}
