import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ArrowRight, ClipboardCheck, Gauge } from 'lucide-react'
import { COR_COMBUSTIVEL } from '@/config/tanquesConfig'
import { formatarVolume } from '@/lib/calcVolume'
import type { useNotaWizard } from '@/hooks/useNotaWizard'

type Wizard = ReturnType<typeof useNotaWizard>

interface Props {
  wizard: Wizard
  onFechar: () => void
  onRevisar: () => void
}

export function NotaWizard({ wizard, onFechar, onRevisar }: Props) {
  const {
    leituraAtual, passo, total, primeiro, ultimo,
    atualizarAltura, avancar, voltar, irPara,
    preenchidos, totalLitros,
  } = wizard

  const inputRef = useRef<HTMLInputElement>(null)
  const cor = COR_COMBUSTIVEL[leituraAtual.tipo]

  // Foca o input a cada troca de passo
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [passo])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (ultimo) onRevisar()
      else if (leituraAtual.valido) avancar()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-brown-900/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg rounded-2xl bg-white border border-brown-200 shadow-warm-lg overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brown-800 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brown-900">Nova Nota de Aferição</h3>
              <p className="text-xs text-brown-400">Tanque {passo + 1} de {total} · {preenchidos} preenchido{preenchidos !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onFechar}
            className="p-2 rounded-xl hover:bg-brown-50 text-brown-400 hover:text-brown-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-1.5">
            {wizard.leituras.map((l, i) => (
              <button
                key={l.tanqueId}
                onClick={() => irPara(i)}
                title={l.nome}
                className={`h-1.5 flex-1 rounded-full transition-colors
                  ${i === passo ? 'bg-brown-800'
                    : l.valido ? 'bg-brown-400'
                    : 'bg-brown-100'}`}
              />
            ))}
          </div>
        </div>

        {/* Conteúdo do passo */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={passo}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center gap-2 mb-5">
                <span className={`w-2.5 h-2.5 rounded-full ${cor.dot}`} />
                <span className="text-lg font-bold text-brown-900">{leituraAtual.nome}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${cor.badge}`}>{leituraAtual.tipo}</span>
              </div>

              <div className="flex gap-5 items-end">
                {/* Tanque visual */}
                <div className="relative w-20 h-44 rounded-2xl border-2 border-brown-200 bg-brown-50 overflow-hidden shrink-0">
                  <motion.div
                    className={`absolute bottom-0 w-full ${cor.barra} opacity-70`}
                    animate={{ height: `${leituraAtual.valido ? leituraAtual.percentual : 0}%` }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-brown-800 drop-shadow-sm">
                      {leituraAtual.valido ? leituraAtual.percentual.toFixed(0) : 0}%
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  {/* Altura */}
                  <div>
                    <label className="block text-xs font-medium text-brown-500 uppercase tracking-wider mb-1.5">
                      Altura medida (cm)
                    </label>
                    <input
                      ref={inputRef}
                      type="number"
                      inputMode="decimal"
                      min={0} max={255} step={0.1}
                      value={leituraAtual.alturaCm}
                      onChange={e => atualizarAltura(leituraAtual.tanqueId, e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="0.0"
                      className={`w-full text-2xl font-bold rounded-xl border bg-brown-50 px-3.5 py-2 text-brown-900
                                  outline-none transition-all
                                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                                  ${leituraAtual.erro
                                    ? 'border-red-300 focus:ring-2 focus:ring-red-100'
                                    : 'border-brown-200 focus:bg-white focus:ring-2 focus:ring-brown-100 focus:border-brown-400'}`}
                    />
                  </div>

                  {/* Volume (arqueação) */}
                  <div>
                    <p className="text-xs font-medium text-brown-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Gauge className="w-3 h-3" /> Volume (arqueação)
                    </p>
                    <p className="text-2xl font-bold font-mono text-brown-800">
                      {leituraAtual.valido ? formatarVolume(leituraAtual.volumeLitros) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {leituraAtual.erro && (
                <p className="mt-3 text-xs text-red-500">{leituraAtual.erro}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer navegação */}
        <div className="border-t border-brown-100 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-brown-400">Total parcial</span>
            <span className="text-sm font-bold font-mono text-brown-800">
              {Math.round(totalLitros).toLocaleString('pt-BR')} L
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={voltar}
              disabled={primeiro}
              className="btn-secondary flex-1 justify-center disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" /> Anterior
            </button>
            {ultimo ? (
              <button
                onClick={onRevisar}
                className="btn-primary flex-1 justify-center"
              >
                <ClipboardCheck className="w-4 h-4" /> Revisar Nota
              </button>
            ) : (
              <button
                onClick={avancar}
                disabled={!leituraAtual.valido}
                className="btn-primary flex-1 justify-center disabled:opacity-40"
              >
                Próximo <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
