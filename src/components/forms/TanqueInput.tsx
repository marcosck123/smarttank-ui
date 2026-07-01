import type { LeiturasTanque } from '@/types'
import { formatarVolume } from '@/lib/calcVolume'

interface Props {
  leitura: LeiturasTanque
  onChange: (tanqueId: number, valor: string) => void
}

export function TanqueInput({ leitura, onChange }: Props) {
  const { tanqueId, nome, comprimentoM, alturaCm, volumeLitros, percentual, valido, erro } = leitura

  const barColor =
    percentual >= 80 ? 'bg-green-500' :
    percentual >= 40 ? 'bg-yellow-400' :
    percentual > 0   ? 'bg-red-500'   : 'bg-surface-600'

  return (
    <div className={`
      rounded-xl border p-4 transition-colors
      ${erro ? 'border-red-500/60 bg-red-950/20' : alturaCm && valido
        ? 'border-brand-500/40 bg-surface-700'
        : 'border-surface-600 bg-surface-700'}
    `}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-semibold text-white">{nome}</span>
          <span className="ml-2 text-xs text-surface-500">L = {comprimentoM}m</span>
        </div>
        {alturaCm && valido && (
          <span className="text-xs font-mono text-brand-500">{percentual.toFixed(1)}%</span>
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
            className={`
              w-full rounded-lg bg-surface-800 border px-3 py-2 text-sm text-white
              placeholder-surface-500 outline-none transition-colors
              focus:ring-2 focus:ring-brand-500/50
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
              [&::-webkit-inner-spin-button]:appearance-none
              ${erro ? 'border-red-500 focus:border-red-400'
                     : 'border-surface-600 focus:border-brand-500'}
            `}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-500">cm</span>
        </div>

        <div className="w-28 text-right">
          {alturaCm && valido ? (
            <span className="text-sm font-mono font-semibold text-white">{formatarVolume(volumeLitros)}</span>
          ) : (
            <span className="text-xs text-surface-500">— L</span>
          )}
        </div>
      </div>

      {/* Barra de nível */}
      <div className="mt-3 h-1.5 rounded-full bg-surface-600 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${alturaCm && valido ? percentual : 0}%` }}
        />
      </div>

      {erro && (
        <p className="mt-1.5 text-xs text-red-400">{erro}</p>
      )}
    </div>
  )
}
