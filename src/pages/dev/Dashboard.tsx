import { LayoutDashboard, TrendingUp, Droplets, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Medicao } from '@/types'
import { formatarVolume } from '@/lib/calcVolume'
import { COR_COMBUSTIVEL, type TipoCombustivel } from '@/config/tanquesConfig'

interface Props { historico: Medicao[] }

export function Dashboard({ historico }: Props) {
  const ultima = historico[0]
  const totalUltima = ultima?.leituras.reduce((a, l) => a + l.volumeLitros, 0) ?? 0
  const baixoNivel = ultima?.leituras.filter(l => l.percentual < 20) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="w-5 h-5 text-brown-600" />
        <h2 className="text-lg font-semibold text-brown-900">Dashboard</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Medições Salvas"     value={String(historico.length)}
          icon={<TrendingUp className="w-5 h-5 text-brown-600" />} />
        <KpiCard label="Total Última Med."   value={`${Math.round(totalUltima).toLocaleString('pt-BR')} L`}
          icon={<Droplets className="w-5 h-5 text-blue-500" />} />
        <KpiCard label="Tanques Baixo Nível" value={String(baixoNivel.length)}
          icon={<AlertTriangle className={`w-5 h-5 ${baixoNivel.length > 0 ? 'text-red-500' : 'text-brown-300'}`} />}
          alert={baixoNivel.length > 0} />
        <KpiCard label="Última Medição"
          value={ultima ? format(new Date(ultima.dataHora), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
          icon={<TrendingUp className="w-5 h-5 text-brown-400" />} />
      </div>

      {ultima && (
        <div className="rounded-2xl bg-white border border-brown-200 shadow-warm-sm p-6">
          <h3 className="text-xs font-semibold text-brown-400 uppercase tracking-wider mb-4">
            Última Medição · Nível por Tanque
          </h3>
          <div className="space-y-3">
            {ultima.leituras.map(l => {
              const cor = COR_COMBUSTIVEL[l.tipo as TipoCombustivel]
              return (
                <div key={l.tanqueId} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-brown-400 text-right shrink-0">{l.nome}</span>
                  <div className="flex-1 h-5 rounded-full bg-brown-100 overflow-hidden relative">
                    <div className={`h-full rounded-full ${cor.barra} opacity-80 transition-all`}
                         style={{ width: `${l.percentual}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brown-800 drop-shadow">
                      {l.percentual.toFixed(1)}%
                    </span>
                  </div>
                  <span className="w-24 text-xs font-mono text-brown-800 text-right shrink-0">
                    {formatarVolume(l.volumeLitros)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, icon, alert }: { label: string; value: string; icon: React.ReactNode; alert?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-warm-sm ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-brown-200'}`}>
      <div className="mb-3">{icon}</div>
      <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-brown-900'}`}>{value}</p>
      <p className="text-xs text-brown-400 mt-1">{label}</p>
    </div>
  )
}
