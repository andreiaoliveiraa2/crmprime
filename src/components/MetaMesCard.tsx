import { Target } from 'lucide-react'
import { ResumoMeta } from '@/lib/calcularMetas'

function fmt(n: number) {
  return n.toLocaleString('pt-BR')
}

export default function MetaMesCard({ resumo, subtitulo }: { resumo: ResumoMeta; subtitulo: string }) {
  const { totalMeta, totalVendido, pct, falta, ritmoSemana, linhas } = resumo

  return (
    <div className="col-span-12 md:col-span-4 bg-white p-4 hover:shadow-md transition-all duration-200"
      style={{ border: '1px solid #e8e4dd', borderRadius: '12px' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
          <Target size={15} style={{ color: '#22c55e' }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold" style={{ color: '#2d1f4e' }}>Meta do mês</h3>
          <p className="text-xs" style={{ color: '#9a918a' }}>{subtitulo}</p>
        </div>
      </div>

      {linhas.length === 0 ? (
        <p className="text-xs py-6 text-center" style={{ color: '#9a918a' }}>Nenhuma meta definida ainda</p>
      ) : (
        <>
          {/* Total do mês */}
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-xl font-extrabold" style={{ background: 'linear-gradient(90deg, #22c55e, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              R$ {fmt(totalVendido)}
            </span>
            <span className="text-xs" style={{ color: '#9a918a' }}>/ R$ {fmt(totalMeta)}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto"
              style={{ backgroundColor: pct >= 80 ? 'rgba(34,197,94,0.12)' : 'rgba(212,168,67,0.15)', color: pct >= 80 ? '#22c55e' : '#b89a6a' }}>
              {pct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: '#f0ece6' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: 'linear-gradient(90deg, #22c55e, #86efac)' }} />
          </div>

          {/* Por operadora */}
          <div className="space-y-1.5">
            {linhas.map(l => (
              <div key={l.operadora} className="flex items-center gap-2 text-xs">
                <span className="w-16 truncate" style={{ color: '#5a4e3c' }}>{l.operadora}</span>
                <div className="flex-1 h-3.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ece6' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, l.pct)}%`, background: 'linear-gradient(90deg, #5b3fb5, #8b6fc0)' }} />
                </div>
                <span className="w-10 text-right font-semibold" style={{ color: '#2d1f4e' }}>{l.pct}%</span>
                <span className="w-24 text-right" style={{ color: l.falta > 0 ? '#b89a6a' : '#22c55e' }}>
                  {l.falta > 0 ? `falta R$ ${fmt(l.falta)}` : 'batida ✓'}
                </span>
              </div>
            ))}
          </div>

          {falta > 0 && (
            <p className="text-xs text-center mt-3" style={{ color: '#9a918a' }}>
              Falta <b style={{ color: '#b89a6a' }}>R$ {fmt(falta)}</b> · ~<b style={{ color: '#b89a6a' }}>R$ {fmt(ritmoSemana)}</b>/semana
            </p>
          )}
        </>
      )}
    </div>
  )
}
