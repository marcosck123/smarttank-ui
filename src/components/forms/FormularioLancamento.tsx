import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Send } from 'lucide-react'
import { GRUPOS_COMBUSTIVEL, COR_COMBUSTIVEL } from '@/config/tanquesConfig'
import { useLancamento } from '@/hooks/useLancamento'
import { TanqueInput } from './TanqueInput'
import { ModalPreview } from '@/components/modals/ModalPreview'
import { ModalConfirmacao } from '@/components/modals/ModalConfirmacao'
import { gerarPlanilha } from '@/lib/gerarPlanilha'
import type { Medicao } from '@/types'
import type { StatusSync } from '@/store/useAppStore'

interface Props {
  operador: string
  onSalvar: (m: Medicao) => Promise<void>
  statusSync: StatusSync
}

function gerarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function FormularioLancamento({ operador, onSalvar, statusSync }: Props) {
  const { leituras, observacoes, setObservacoes, atualizarAltura, todasPreenchidas } = useLancamento()

  const [medicaoPreview, setMedicaoPreview] = useState<Medicao | null>(null)
  const [confirming, setConfirming]         = useState(false)
  const [emitindo, setEmitindo]             = useState(false)

  const totalLitros = leituras.reduce((acc, l) => acc + (l.valido ? l.volumeLitros : 0), 0)

  function handleAvancar(e: React.FormEvent) {
    e.preventDefault()
    if (!todasPreenchidas) return
    const medicao: Medicao = {
      id: gerarId(),
      dataHora: new Date().toISOString(),
      operador,
      leituras,
      observacoes,
    }
    setMedicaoPreview(medicao)
  }

  async function handleConfirmar() {
    if (!medicaoPreview) return
    setEmitindo(true)
    try {
      await onSalvar(medicaoPreview)
      await gerarPlanilha(medicaoPreview)
      setConfirming(false)
      setMedicaoPreview(null)
    } finally {
      setEmitindo(false)
    }
  }

  return (
    <>
      <form onSubmit={handleAvancar} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brown-600" />
            <h2 className="text-lg font-semibold text-brown-900">Lançamento de Medição</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-brown-400">Operador</p>
            <p className="text-sm font-semibold text-brown-800">{operador}</p>
          </div>
        </div>

        {GRUPOS_COMBUSTIVEL.map(({ tipo, tanques }) => {
          const leiturasGrupo = leituras.filter(l => l.tipo === tipo)
          const totalGrupo    = leiturasGrupo.reduce((acc, l) => acc + (l.valido ? l.volumeLitros : 0), 0)
          const cor           = COR_COMBUSTIVEL[tipo]

          return (
            <section key={tipo}>
              <div className={`flex items-center justify-between rounded-xl border px-4 py-2 mb-3 ${cor.grupo}`}>
                <span className="text-sm font-semibold">{tipo}</span>
                {totalGrupo > 0 && (
                  <span className="text-xs font-mono">
                    {Math.round(totalGrupo).toLocaleString('pt-BR')} L
                  </span>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tanques.map(tanque => {
                  const leitura = leiturasGrupo.find(l => l.tanqueId === tanque.id)!
                  return <TanqueInput key={tanque.id} leitura={leitura} onChange={atualizarAltura} />
                })}
              </div>
            </section>
          )
        })}

        <section>
          <label className="block text-sm font-medium text-brown-600 mb-2">Observações da Noite</label>
          <textarea
            rows={3}
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            placeholder="Registro de ocorrências, abastecimentos, manutenções…"
            className="w-full rounded-2xl bg-brown-50 border border-brown-200 px-4 py-3 text-sm
                       text-brown-900 placeholder:text-brown-300 outline-none resize-none
                       focus:ring-2 focus:ring-brown-100 focus:border-brown-400 transition-all"
          />
        </section>

        <div className="flex items-center justify-between rounded-2xl bg-white border border-brown-200 shadow-warm-sm px-5 py-4">
          <div>
            <p className="text-xs text-brown-400">Total geral</p>
            <p className="text-2xl font-bold font-mono text-brown-900">
              {Math.round(totalLitros).toLocaleString('pt-BR')} L
            </p>
          </div>
          <motion.button
            type="submit"
            disabled={!todasPreenchidas || statusSync === 'salvando'}
            whileTap={{ scale: 0.97 }}
            className="btn-primary flex items-center gap-2 px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Avançar para Conferência
          </motion.button>
        </div>
      </form>

      <AnimatePresence>
        {medicaoPreview && (
          <ModalPreview
            medicao={medicaoPreview}
            onEmitir={() => setConfirming(true)}
            onFechar={() => setMedicaoPreview(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirming && (
          <ModalConfirmacao
            emitindo={emitindo}
            onConfirmar={handleConfirmar}
            onCancelar={() => setConfirming(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
