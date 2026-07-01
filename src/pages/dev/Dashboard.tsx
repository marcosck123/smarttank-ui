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
        <LayoutDashboard className="w-5 h-5 text-green-400" />
        <h2 className="text-lg font-semibold text-white">Dashboard</h2>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Medições Salvas',   value: historico.length,       icon: <TrendingUp className="w-5 h-5" />, cor: 'green' },
          { label: 'Total Última Med.', value: `${Math.round(totalUltima).toLocaleString('pt-BR')} L`, icon: <Droplets className="w-5 h-5" />, cor: 'blue' },
          { label: 'Tanques Baixo Nível', value: baixoNivel.length,    icon: <AlertTriangle className="w-5 h-5" />, cor: baixoNivel.length > 0 ? 'red' : 'slate' },
          { label: 'Última Medição',    value: ultima ? format(new Date(ultima.dataHora), 'dd/MM HH:mm', { locale: ptBR }) : '—', icon: <TrendingUp className="w-5 h-5" />, cor: 'purple' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-5">
            <div className={`text-${k.cor}-400 mb-3`}>{k.icon}</div>
            <p className="text-2xl font-bold text-white">{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Última medição — barras de nível */}
      {ultima && (
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Última Medição · Nível por Tanque
          </h3>
          <div className="space-y-3">
            {ultima.leituras.map(l => {
              const cor = COR_COMBUSTIVEL[l.tipo as TipoCombustivel]
              return (
                <div key={l.tanqueId} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-slate-400 text-right shrink-0">{l.nome}</span>
                  <div className="flex-1 h-5 rounded-full bg-slate-700 overflow-hidden relative">
                    <div className={`h-full rounded-full ${cor.bar} opacity-80 transition-all`}
                         style={{ width: `${l.percentual}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                      {l.percentual.toFixed(1)}%
                    </span>
                  </div>
                  <span className="w-24 text-xs font-mono text-white text-right shrink-0">
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
