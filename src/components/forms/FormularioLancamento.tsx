import { ClipboardList, Send } from 'lucide-react'
import { GRUPOS_COMBUSTIVEL } from '@/config/tanquesConfig'
import { useLancamento } from '@/hooks/useLancamento'
import { TanqueInput } from './TanqueInput'
import type { Medicao } from '@/types'

const COR_TIPO: Record<string, string> = {
  'Gasolina Comum':     'text-yellow-400  border-yellow-400/30  bg-yellow-400/5',
  'Gasolina Aditivada': 'text-orange-400  border-orange-400/30  bg-orange-400/5',
  'Etanol':             'text-green-400   border-green-400/30   bg-green-400/5',
  'Diesel S10':         'text-blue-400    border-blue-400/30    bg-blue-400/5',
  'Diesel S500':        'text-purple-400  border-purple-400/30  bg-purple-400/5',
}

interface Props {
  operador: string
  onPreview: (medicao: Omit<Medicao, 'id' | 'dataHora'>) => void
}

export function FormularioLancamento({ operador, onPreview }: Props) {
  const { leituras, observacoes, setObservacoes, atualizarAltura, todasPreenchidas } = useLancamento()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!todasPreenchidas) return
    onPreview({ operador, leituras, observacoes })
  }

  const totalLitros = leituras.reduce((acc, l) => acc + (l.valido ? l.volumeLitros : 0), 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-white">Lançamento de Medição</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-surface-500">Operador</p>
          <p className="text-sm font-medium text-white">{operador}</p>
        </div>
      </div>

      {/* Grupos por combustível */}
      {GRUPOS_COMBUSTIVEL.map(({ tipo, tanques }) => {
        const leiturasGrupo = leituras.filter(l => l.tipo === tipo)
        const totalGrupo = leiturasGrupo.reduce((acc, l) => acc + (l.valido ? l.volumeLitros : 0), 0)
        const cor = COR_TIPO[tipo] ?? 'text-white border-surface-600 bg-surface-800'

        return (
          <section key={tipo}>
            <div className={`flex items-center justify-between rounded-lg border px-3 py-2 mb-3 ${cor}`}>
              <span className="text-sm font-semibold">{tipo}</span>
              {totalGrupo > 0 && (
                <span className="text-xs font-mono">
                  {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0 }).format(Math.round(totalGrupo))} L
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tanques.map(tanque => {
                const leitura = leiturasGrupo.find(l => l.tanqueId === tanque.id)!
                return (
                  <TanqueInput
                    key={tanque.id}
                    leitura={leitura}
                    onChange={atualizarAltura}
                  />
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Observações */}
      <section>
        <label className="block text-sm font-medium text-surface-400 mb-2">
          Observações da Noite
        </label>
        <textarea
          rows={3}
          value={observacoes}
          onChange={e => setObservacoes(e.target.value)}
          placeholder="Registro de ocorrências, abastecimentos, manutenções…"
          className="w-full rounded-xl bg-surface-700 border border-surface-600 px-4 py-3 text-sm
                     text-white placeholder-surface-500 outline-none resize-none
                     focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
        />
      </section>

      {/* Rodapé */}
      <div className="flex items-center justify-between rounded-xl bg-surface-700 border border-surface-600 px-4 py-3">
        <div>
          <p className="text-xs text-surface-500">Total geral (todos os tanques)</p>
          <p className="text-xl font-bold font-mono text-white">
            {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1 }).format(totalLitros)} L
          </p>
        </div>
        <button
          type="submit"
          disabled={!todasPreenchidas}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                     bg-brand-600 text-white hover:bg-brand-500
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <Send className="w-4 h-4" />
          Pré-visualizar / Emitir
        </button>
      </div>
    </form>
  )
}
