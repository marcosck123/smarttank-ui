import { X, Download, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Medicao } from '@/types'
import { formatarVolume } from '@/lib/calcVolume'

const COR_BARRA: Record<string, string> = {
  'Gasolina Comum':     'bg-yellow-400',
  'Gasolina Aditivada': 'bg-orange-400',
  'Etanol':             'bg-green-400',
  'Diesel S10':         'bg-blue-400',
  'Diesel S500':        'bg-purple-400',
}

interface Props {
  medicao: Medicao
  onConfirmar: () => void
  onFechar: () => void
  emitindo: boolean
}

export function ModalPreview({ medicao, onConfirmar, onFechar, emitindo }: Props) {
  const dataFormatada = format(new Date(medicao.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  const totalLitros = medicao.leituras.reduce((acc, l) => acc + l.volumeLitros, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl
                      bg-surface-800 border border-surface-600 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-600 sticky top-0 bg-surface-800">
          <div>
            <h2 className="text-lg font-bold text-white">Conferência da Medição</h2>
            <p className="text-sm text-surface-400">{dataFormatada}</p>
          </div>
          <button
            onClick={onFechar}
            className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-surface-700 border border-surface-600 p-3">
              <p className="text-xs text-surface-500">Operador</p>
              <p className="text-sm font-semibold text-white mt-0.5">{medicao.operador}</p>
            </div>
            <div className="rounded-xl bg-surface-700 border border-surface-600 p-3">
              <p className="text-xs text-surface-500">Total geral</p>
              <p className="text-sm font-semibold font-mono text-brand-500 mt-0.5">
                {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1 }).format(totalLitros)} L
              </p>
            </div>
          </div>

          {/* Gráfico de barras horizontais */}
          <section>
            <h3 className="text-sm font-semibold text-surface-400 mb-3 uppercase tracking-wider">
              Nível por Tanque
            </h3>
            <div className="space-y-2">
              {medicao.leituras.map(l => {
                const corBarra = COR_BARRA[l.tipo] ?? 'bg-surface-500'
                return (
                  <div key={l.tanqueId} className="flex items-center gap-3">
                    <span className="w-16 text-xs text-surface-400 text-right shrink-0">{l.nome}</span>
                    <div className="flex-1 h-5 rounded-full bg-surface-700 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${corBarra} opacity-80`}
                        style={{ width: `${l.percentual}%` }}
                      />
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
          </section>

          {/* Tabela de resultados */}
          <section>
            <h3 className="text-sm font-semibold text-surface-400 mb-3 uppercase tracking-wider">
              Tabela de Resultados
            </h3>
            <div className="overflow-x-auto rounded-xl border border-surface-600">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-600 bg-surface-700">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">Tanque</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">Combustível</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-surface-400">Altura (cm)</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-surface-400">Volume (L)</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-surface-400">Nível</th>
                  </tr>
                </thead>
                <tbody>
                  {medicao.leituras.map((l, i) => (
                    <tr
                      key={l.tanqueId}
                      className={`border-b border-surface-700 ${i % 2 === 0 ? 'bg-surface-800' : 'bg-surface-750'}`}
                    >
                      <td className="px-3 py-2 text-white font-medium">{l.nome}</td>
                      <td className="px-3 py-2 text-surface-300">{l.tipo}</td>
                      <td className="px-3 py-2 text-right font-mono text-white">{l.alturaCm}</td>
                      <td className="px-3 py-2 text-right font-mono text-brand-500">
                        {formatarVolume(l.volumeLitros)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-surface-300">
                        {l.percentual.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Observações */}
          {medicao.observacoes && (
            <section>
              <h3 className="text-sm font-semibold text-surface-400 mb-2 uppercase tracking-wider">Observações</h3>
              <p className="text-sm text-surface-300 bg-surface-700 rounded-xl px-4 py-3 border border-surface-600">
                {medicao.observacoes}
              </p>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-600 sticky bottom-0 bg-surface-800">
          <button
            onClick={onFechar}
            className="px-4 py-2 rounded-xl text-sm text-surface-300 hover:text-white hover:bg-surface-700 transition-colors"
          >
            Corrigir
          </button>
          <button
            onClick={onConfirmar}
            disabled={emitindo}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                       bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-50
                       transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <Download className="w-4 h-4" />
            {emitindo ? 'Gerando…' : 'Confirmar e Emitir'}
            {!emitindo && <CheckCircle className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
