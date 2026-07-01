import type { LeiturasTanque } from '@/types'
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
    percentual >= 40 ? 'bg-amber-400' :
    percentual >  0  ? 'bg-red-400'   : 'bg-brown-100'

  const formatarVol = (l: number) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(l) + ' L'

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-150
      ${erro
        ? 'border-red-200 bg-red-50'
        : alturaCm && valido
          ? 'border-brown-200 bg-white shadow-warm-sm'
          : 'border-brown-100 bg-white'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${cor.dot}`} />
          <span className="text-[13px] font-semibold text-brown-900">{nome}</span>
          <span className="text-[11px] text-brown-300">L={comprimentoM}m</span>
        </div>
        {alturaCm && valido && (
          <span className="text-[11px] font-semibold text-brown-500 font-mono">
            {percentual.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <input
            type="number"
            inputMode="decimal"
            min={0} max={255} step={0.1}
            value={alturaCm}
            onChange={e => onChange(tanqueId, e.target.value)}
            placeholder="Altura (cm)"
            className={`w-full rounded-xl border bg-brown-50 px-3.5 py-2 text-sm text-brown-900
                        placeholder:text-brown-300 outline-none transition-all pr-10
                        focus:bg-white focus:ring-2 focus:ring-brown-100
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                        [&::-webkit-inner-spin-button]:appearance-none
                        ${erro
                          ? 'border-red-300 focus:border-red-400'
                          : 'border-brown-200 focus:border-brown-400'}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brown-300">cm</span>
        </div>

        <div className="w-28 text-right">
          {alturaCm && valido
            ? <span className="text-sm font-semibold font-mono text-brown-800">{formatarVol(volumeLitros)}</span>
            : <span className="text-xs text-brown-300">— L</span>
          }
        </div>
      </div>

      <div className="mt-3 h-1 rounded-full bg-brown-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${nivelCor}`}
             style={{ width: `${alturaCm && valido ? percentual : 0}%` }} />
      </div>

      {erro && <p className="mt-1.5 text-xs text-red-500">{erro}</p>}
    </div>
  )
}
