import type { LeiturasTanque } from '@/types'
import { formatarVolume } from '@/lib/calcVolume'
import { COR_COMBUSTIVEL } from '@/config/tanquesConfig'

interface Props {
  leitura: LeiturasTanque
  onChange: (tanqueId: number, valor: string) => void
}

export function TanqueInput({ leitura, onChange }: Props) {
  const { tanqueId, nome, tipo, comprimentoM, alturaCm, volumeLitros, percentual, valido, erro } = leitura
  const cor = COR_COMBUSTIVEL[tipo]

  const nivelCor =
    percentual >= 80 ? 'bg-green-500' :
    percentual >= 40 ? 'bg-yellow-400' :
    percentual > 0   ? 'bg-red-500'   : 'bg-slate-700'

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-200
      ${erro ? 'border-red-500/50 bg-red-950/20'
             : alturaCm && valido ? `${cor.border} bg-slate-800/60` : 'border-slate-700/50 bg-slate-800/40'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-semibold text-white">{nome}</span>
          <span className="ml-2 text-xs text-slate-600">L = {comprimentoM}m</span>
        </div>
        {alturaCm && valido && (
          <span className={`text-xs font-mono font-semibold ${cor.text}`}>{percentual.toFixed(1)}%</span>
        )}
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={255}
            step={0.1}
            value={alturaCm}
            onChange={e => onChange(tanqueId, e.target.value)}
            placeholder="Altura (cm)"
            className={`w-full rounded-xl bg-slate-900/60 border px-3 py-2.5 text-sm text-white
                        placeholder-slate-600 outline-none transition-all
                        focus:ring-2 focus:ring-green-500/25
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                        [&::-webkit-inner-spin-button]:appearance-none
                        ${erro ? 'border-red-500/60 focus:border-red-400'
                               : 'border-slate-700/60 focus:border-green-500/50'}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">cm</span>
        </div>

        <div className="w-28 text-right">
          {alturaCm && valido
            ? <span className={`text-sm font-mono font-semibold ${cor.text}`}>{formatarVolume(volumeLitros)}</span>
            : <span className="text-xs text-slate-600">— L</span>
          }
        </div>
      </div>

      {/* Barra de nível */}
      <div className="mt-3 h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${nivelCor}`}
          style={{ width: `${alturaCm && valido ? percentual : 0}%` }}
        />
      </div>

      {erro && <p className="mt-1.5 text-xs text-red-400">{erro}</p>}
    </div>
  )
}
