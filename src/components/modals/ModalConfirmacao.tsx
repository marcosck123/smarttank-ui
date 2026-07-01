import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  emitindo: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ModalConfirmacao({ emitindo, onConfirmar, onCancelar }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.85, y: -10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: -10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-2xl bg-white border border-brown-200 shadow-warm-lg p-6"
      >
        <div className="text-center space-y-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-brown-100 border border-brown-200
                          flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-brown-700" />
          </div>
          <h3 className="text-base font-bold text-brown-900">Deseja criar a planilha?</h3>
          <p className="text-sm text-brown-500 leading-relaxed">
            A medição será salva no histórico e o arquivo <strong className="text-brown-800">.xlsx</strong> será gerado automaticamente.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            disabled={emitindo}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-40"
          >
            <XCircle className="w-4 h-4" />
            Não, Cancelar
          </button>

          <motion.button
            onClick={onConfirmar}
            disabled={emitindo}
            whileTap={{ scale: 0.97 }}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-50"
          >
            {emitindo
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando…</>
              : <><CheckCircle2 className="w-4 h-4" /> Sim, Confirmar</>
            }
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
