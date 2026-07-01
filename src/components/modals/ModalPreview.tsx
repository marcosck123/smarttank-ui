import { motion } from 'framer-motion'
import { X, FileSpreadsheet } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/context/AuthContext'
import type { Medicao } from '@/types'
import { formatarVolume } from '@/lib/calcVolume'
import { COR_COMBUSTIVEL, type TipoCombustivel } from '@/config/tanquesConfig'

interface Props {
  medicao: Medicao
  onEmitir: () => void
  onFechar: () => void
}

export function ModalPreview({ medicao, onEmitir, onFechar }: Props) {
  const { isDev } = useAuth()
  const dataFormatada = format(new Date(medicao.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  const total = medicao.leituras.reduce((a, l) => a + l.volumeLitros, 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.93, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 24 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl
                   bg-slate-900 border border-slate-700/60 shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4
                        border-b border-slate-700/50 bg-slate-900 z-10">
          <div>
            <h2 className="text-lg font-bold text-white">Conferência da Medição</h2>
            <p className="text-sm text-slate-400">{dataFormatada}</p>
          </div>
          <button onClick={onFechar}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <InfoCard label="Operador" value={medicao.operador} />
            <InfoCard label="Total geral" value={`${Math.round(total).toLocaleString('pt-BR')} L`} destaque />
          </div>

          {/* Gráfico de barras (somente Dev) */}
          {isDev && (
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Nível por Tanque</h3>
              <div className="space-y-2">
                {medicao.leituras.map(l => {
                  const cor = COR_COMBUSTIVEL[l.tipo as TipoCombustivel]
                  return (
                    <div key={l.tanqueId} className="flex items-center gap-3">
                      <span className="w-16 text-xs text-slate-400 text-right shrink-0">{l.nome}</span>
                      <div className="flex-1 h-5 rounded-full bg-slate-800 overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${l.percentual}%` }}
                          transition={{ duration: 0.5, delay: 0.05 * l.tanqueId }}
                          className={`h-full rounded-full ${cor.bar} opacity-80`}
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
          )}

          {/* Tabela */}
          <section>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tabela de Resultados</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-700/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-slate-700/50">
                    {['Tanque', 'Combustível', 'Altura (cm)', 'Volume (L)', 'Nível'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {medicao.leituras.map((l, i) => (
                    <tr key={l.tanqueId} className={`border-b border-slate-800 ${i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}`}>
                      <td className="px-3 py-2 text-white font-medium">{l.nome}</td>
                      <td className="px-3 py-2 text-slate-400 text-xs">{l.tipo}</td>
                      <td className="px-3 py-2 font-mono text-slate-300">{l.alturaCm}</td>
                      <td className="px-3 py-2 font-mono font-semibold text-green-400">{formatarVolume(l.volumeLitros)}</td>
                      <td className="px-3 py-2 font-mono text-slate-400">{l.percentual.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {medicao.observacoes && (
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Observações</h3>
              <p className="text-sm text-slate-300 bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/50">
                {medicao.observacoes}
              </p>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4
                        border-t border-slate-700/50 bg-slate-900">
          <button onClick={onFechar}
            className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            Corrigir
          </button>
          <motion.button
            onClick={onEmitir}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                       bg-gradient-to-r from-green-600 to-emerald-600 text-white
                       hover:from-green-500 hover:to-emerald-500
                       shadow-lg shadow-green-900/30 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Emitir Planilha
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function InfoCard({ label, value, destaque }: { label: string; value: string; destaque?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-base font-semibold ${destaque ? 'text-green-400 font-mono' : 'text-white'}`}>{value}</p>
    </div>
  )
}
