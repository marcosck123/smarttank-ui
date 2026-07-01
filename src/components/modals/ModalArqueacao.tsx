/**
 * Modal Pequeno de Edição de Arqueação — SmartTank
 *
 * Exibe a tabela de 255 alturas de um tanque com seus volumes.
 * O Dev pode clicar em qualquer célula de Altura ou Volume para editar.
 * O valor fixado é persistido via arqueacaoService (Supabase + localStorage).
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, CheckCircle2, Loader2 } from 'lucide-react'
import {
  getTabelaTanque,
  salvarOverride,
  removerOverride,
} from '@/lib/arqueacao/arqueacaoService'
import type { TanqueConfig } from '@/config/tanquesConfig'
import { COR_COMBUSTIVEL } from '@/config/tanquesConfig'

interface Linha {
  alturaCm: number
  volumeLitros: number
  isOverride: boolean
}

interface CelulaEditando {
  alturaCm: number
  campo: 'altura' | 'volume'
}

interface Props {
  tanque: TanqueConfig
  onFechar: () => void
}

export function ModalArqueacao({ tanque, onFechar }: Props) {
  const [tabela, setTabela] = useState<Linha[]>(() => getTabelaTanque(tanque.id))
  const [editando, setEditando] = useState<CelulaEditando | null>(null)
  const [valorInput, setValorInput] = useState('')
  const [salvando, setSalvando]   = useState(false)
  const [feedbackLinha, setFeedbackLinha] = useState<number | null>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const cor = COR_COMBUSTIVEL[tanque.tipo]

  // Foca o input ao abrir célula
  useEffect(() => {
    if (editando) {
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [editando])

  // Fecha com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editando) setEditando(null)
        else onFechar()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editando, onFechar])

  // ── Iniciar edição de uma célula ────────────────────────────────────────

  function iniciarEdicao(linha: Linha, campo: 'altura' | 'volume') {
    const valor = campo === 'altura'
      ? String(linha.alturaCm)
      : String(linha.volumeLitros)
    setEditando({ alturaCm: linha.alturaCm, campo })
    setValorInput(valor)
  }

  // ── Confirmar edição e persistir ────────────────────────────────────────

  const confirmarEdicao = useCallback(async () => {
    if (!editando) return
    const parsed = parseFloat(valorInput.replace(',', '.'))
    if (isNaN(parsed) || parsed < 0) {
      setEditando(null)
      return
    }

    // Monta o override: campo "altura" muda a chave, "volume" muda o valor
    const override = {
      tanqueId:     tanque.id,
      alturaCm:     editando.campo === 'altura' ? Math.round(parsed) : editando.alturaCm,
      volumeLitros: editando.campo === 'volume' ? Math.round(parsed * 10) / 10 : tabela.find(l => l.alturaCm === editando.alturaCm)?.volumeLitros ?? 0,
    }

    setSalvando(true)
    await salvarOverride(override)
    setSalvando(false)

    // Recarrega a tabela para refletir o novo estado mesclado
    setTabela(getTabelaTanque(tanque.id))
    setEditando(null)

    // Feedback visual na linha
    setFeedbackLinha(override.alturaCm)
    setTimeout(() => setFeedbackLinha(null), 1400)
  }, [editando, valorInput, tanque.id, tabela])

  // ── Restaurar linha para o valor padrão ────────────────────────────────

  async function restaurarLinha(alturaCm: number) {
    setSalvando(true)
    await removerOverride(tanque.id, alturaCm)
    setSalvando(false)
    setTabela(getTabelaTanque(tanque.id))
  }

  const totalOverrides = tabela.filter(l => l.isOverride).length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-900/30 backdrop-blur-[2px]"
      onClick={e => e.target === e.currentTarget && onFechar()}
    >
      <motion.div
        initial={{ scale: 0.96, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 12, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white rounded-2xl border border-brown-200
                   shadow-warm-lg overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}
      >

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brown-100">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-brown-900">{tanque.nome} — Arqueação</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block w-2 h-2 rounded-full ${cor.dot}`} />
                <span className="text-xs text-brown-400">{tanque.tipo}</span>
                {totalOverrides > 0 && (
                  <span className="ml-1 text-[10px] bg-amber-50 text-amber-600 border border-amber-200
                                   rounded-full px-1.5 py-px font-medium">
                    {totalOverrides} editado{totalOverrides > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {salvando && <Loader2 className="w-3.5 h-3.5 text-brown-400 animate-spin" />}
            <button
              onClick={onFechar}
              className="p-1.5 rounded-lg text-brown-400 hover:text-brown-600 hover:bg-brown-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Legenda ─────────────────────────────────────────────────────── */}
        <div className="px-5 py-2.5 border-b border-brown-100 bg-brown-50/60
                        flex items-center justify-between text-xs text-brown-400">
          <span>Clique em qualquer valor para editar e fixar</span>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm bg-amber-200" />
            <span>Valor editado</span>
          </div>
        </div>

        {/* ── Cabeçalho da tabela (fixo) ──────────────────────────────────── */}
        <div className="grid grid-cols-[56px_1fr_1fr_32px] px-5 py-2 border-b border-brown-100 bg-brown-50">
          <span className="text-[11px] font-semibold text-brown-400 uppercase tracking-wider">#</span>
          <span className="text-[11px] font-semibold text-brown-400 uppercase tracking-wider">Altura (cm)</span>
          <span className="text-[11px] font-semibold text-brown-400 uppercase tracking-wider">Volume (L)</span>
          <span />
        </div>

        {/* ── Lista rolável (255 linhas) ───────────────────────────────────── */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto divide-y divide-brown-50"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
        >
          {tabela.map(linha => {
            const isEditandoAltura = editando?.alturaCm === linha.alturaCm && editando.campo === 'altura'
            const isEditandoVolume = editando?.alturaCm === linha.alturaCm && editando.campo === 'volume'
            const isFeedback = feedbackLinha === linha.alturaCm

            return (
              <div
                key={linha.alturaCm}
                className={`grid grid-cols-[56px_1fr_1fr_32px] items-center px-5 py-1.5 group
                            transition-colors duration-150
                            ${isFeedback ? 'bg-emerald-50' : linha.isOverride ? 'bg-amber-50/60' : 'hover:bg-brown-50'}`}
              >
                {/* Índice */}
                <span className="text-xs text-brown-300 font-mono select-none">
                  {linha.alturaCm}
                </span>

                {/* Altura — clicável */}
                <div
                  onClick={() => !editando && iniciarEdicao(linha, 'altura')}
                  className="cursor-text"
                >
                  {isEditandoAltura ? (
                    <input
                      ref={inputRef}
                      type="number"
                      value={valorInput}
                      onChange={e => setValorInput(e.target.value)}
                      onBlur={confirmarEdicao}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmarEdicao()
                        if (e.key === 'Tab') { e.preventDefault(); confirmarEdicao() }
                      }}
                      className="w-20 text-xs rounded border border-brown-200 bg-white
                                 px-1.5 py-1 text-brown-900 outline-none
                                 focus:border-brown-400 focus:ring-2 focus:ring-brown-100
                                 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                                 [&::-webkit-inner-spin-button]:appearance-none"
                      min={1} max={255} step={1}
                    />
                  ) : (
                    <span className={`text-xs font-mono select-none
                                     ${linha.isOverride ? 'text-amber-700 font-semibold' : 'text-brown-600'}
                                     group-hover:text-brown-900 transition-colors`}>
                      {linha.alturaCm}
                    </span>
                  )}
                </div>

                {/* Volume — clicável */}
                <div
                  onClick={() => !editando && iniciarEdicao(linha, 'volume')}
                  className="cursor-text"
                >
                  {isEditandoVolume ? (
                    <input
                      ref={inputRef}
                      type="number"
                      value={valorInput}
                      onChange={e => setValorInput(e.target.value)}
                      onBlur={confirmarEdicao}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmarEdicao()
                        if (e.key === 'Tab') { e.preventDefault(); confirmarEdicao() }
                      }}
                      className="w-24 text-xs rounded border border-brown-200 bg-white
                                 px-1.5 py-1 text-brown-900 outline-none
                                 focus:border-brown-400 focus:ring-2 focus:ring-brown-100
                                 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                                 [&::-webkit-inner-spin-button]:appearance-none"
                      min={0} step={0.1}
                    />
                  ) : (
                    <span className={`text-xs font-mono select-none
                                     ${linha.isOverride ? 'text-amber-700 font-semibold' : 'text-brown-600'}
                                     group-hover:text-brown-900 transition-colors`}>
                      {linha.volumeLitros.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </span>
                  )}
                </div>

                {/* Ações — restaurar override */}
                <div className="flex items-center justify-center">
                  <AnimatePresence>
                    {isFeedback && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </motion.span>
                    )}
                    {!isFeedback && linha.isOverride && !editando && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        title="Restaurar valor padrão"
                        onClick={() => restaurarLinha(linha.alturaCm)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded
                                   text-brown-300 hover:text-amber-500 transition-all"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-t border-brown-100 bg-brown-50/50
                        flex items-center justify-between">
          <p className="text-xs text-brown-400">
            {totalOverrides === 0
              ? 'Todos os valores estão no padrão calculado'
              : `${totalOverrides} valor${totalOverrides > 1 ? 'es' : ''} personalizado${totalOverrides > 1 ? 's' : ''}`}
          </p>
          <button
            onClick={onFechar}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-brown-800 text-white
                       hover:bg-brown-700 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>

      </motion.div>
    </motion.div>
  )
}
