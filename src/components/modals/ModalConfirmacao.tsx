import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  emitindo: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ModalConfirmacao({ emitindo, onConfirmar, onCancelar }: Props) {
  return (
    // z-50 garante que fica por cima do ModalPreview (z-40)
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
        className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-600/60
                   shadow-2xl shadow-black/50 p-6"
      >
        <div className="text-center space-y-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30
                          flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-base font-bold text-white">Deseja criar a planilha?</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            A medição será salva no histórico e o arquivo <strong className="text-white">.xlsx</strong> será gerado automaticamente.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            disabled={emitindo}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                       border border-slate-600 text-slate-300 text-sm font-medium
                       hover:border-slate-500 hover:text-white transition-all disabled:opacity-40"
          >
            <XCircle className="w-4 h-4" />
            Não, Cancelar
          </button>

          <motion.button
            onClick={onConfirmar}
            disabled={emitindo}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                       bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold
                       hover:from-green-500 hover:to-emerald-500
                       disabled:opacity-50 transition-all shadow-lg shadow-green-900/30"
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
