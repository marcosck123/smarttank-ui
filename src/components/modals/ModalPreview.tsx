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
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-brown-900/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.93, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 24 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl
                   bg-white border border-brown-200 shadow-warm-lg"
      >
        <div className="sticky top-0 flex items-center justify-between px-6 py-4
                        border-b border-brown-100 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-brown-900">Conferência da Medição</h2>
            <p className="text-sm text-brown-400">{dataFormatada}</p>
          </div>
          <button onClick={onFechar}
            className="p-2 rounded-xl hover:bg-brown-50 text-brown-400 hover:text-brown-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <InfoCard label="Operador" value={medicao.operador} />
            <InfoCard label="Total geral" value={`${Math.round(total).toLocaleString('pt-BR')} L`} destaque />
          </div>

          {isDev && (
            <section>
              <h3 className="text-xs font-semibold text-brown-400 uppercase tracking-wider mb-3">Nível por Tanque</h3>
              <div className="space-y-2">
                {medicao.leituras.map(l => {
                  const cor = COR_COMBUSTIVEL[l.tipo as TipoCombustivel]
                  return (
                    <div key={l.tanqueId} className="flex items-center gap-3">
                      <span className="w-16 text-xs text-brown-400 text-right shrink-0">{l.nome}</span>
                      <div className="flex-1 h-5 rounded-full bg-brown-100 overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${l.percentual}%` }}
                          transition={{ duration: 0.5, delay: 0.05 * l.tanqueId }}
                          className={`h-full rounded-full ${cor.barra} opacity-80`}
                        />
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
            </section>
          )}

          <section>
            <h3 className="text-xs font-semibold text-brown-400 uppercase tracking-wider mb-3">Tabela de Resultados</h3>
            <div className="overflow-x-auto rounded-xl border border-brown-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brown-50 border-b border-brown-200">
                    {['Tanque', 'Combustível', 'Altura (cm)', 'Volume (L)', 'Nível'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-brown-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {medicao.leituras.map((l, i) => (
                    <tr key={l.tanqueId} className={`border-b border-brown-100 ${i % 2 === 0 ? 'bg-white' : 'bg-brown-50/50'}`}>
                      <td className="px-3 py-2 text-brown-900 font-medium">{l.nome}</td>
                      <td className="px-3 py-2 text-brown-400 text-xs">{l.tipo}</td>
                      <td className="px-3 py-2 font-mono text-brown-700">{l.alturaCm}</td>
                      <td className="px-3 py-2 font-mono font-semibold text-brown-800">{formatarVolume(l.volumeLitros)}</td>
                      <td className="px-3 py-2 font-mono text-brown-500">{l.percentual.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {medicao.observacoes && (
            <section>
              <h3 className="text-xs font-semibold text-brown-400 uppercase tracking-wider mb-2">Observações</h3>
              <p className="text-sm text-brown-700 bg-brown-50 rounded-xl px-4 py-3 border border-brown-100">
                {medicao.observacoes}
              </p>
            </section>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4
                        border-t border-brown-100 bg-white">
          <button onClick={onFechar} className="btn-secondary px-4 py-2.5">
            Corrigir
          </button>
          <motion.button
            onClick={onEmitir}
            whileTap={{ scale: 0.97 }}
            className="btn-primary flex items-center gap-2 px-5 py-2.5"
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
    <div className="rounded-xl bg-brown-50 border border-brown-100 p-4">
      <p className="text-xs text-brown-400 mb-0.5">{label}</p>
      <p className={`text-base font-semibold ${destaque ? 'text-brown-800 font-mono' : 'text-brown-900'}`}>{value}</p>
    </div>
  )
}
