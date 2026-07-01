import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Eye, Edit2, X, ArrowUpDown } from 'lucide-react'
import { TANQUES, COR_COMBUSTIVEL, ALTURA_MAX_CM, type TanqueConfig } from '@/config/tanquesConfig'
import { calcularVolume, calcularAlturaDeVolume, calcularVolumeMax, formatarVolume } from '@/lib/calcVolume'

export function GestaoTanques() {
  const [tanqueSelecionado, setTanqueSelecionado] = useState<TanqueConfig | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Database className="w-5 h-5 text-green-400" />
        <h2 className="text-lg font-semibold text-white">Gestão de Tanques</h2>
        <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full px-2 py-0.5 ml-1">
          DEV
        </span>
      </div>

      <div className="rounded-2xl border border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700/50">
              {['Tanque', 'Combustível', 'Comprimento', 'Raio', 'Vol. Máx.', 'Ações'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TANQUES.map((t, i) => {
              const cor = COR_COMBUSTIVEL[t.tipo]
              const vMax = calcularVolumeMax(t.comprimento)
              return (
                <tr key={t.id} className={`border-b border-slate-800 ${i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}`}>
                  <td className="px-4 py-3 font-semibold text-white">{t.nome}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cor.text} ${cor.border} ${cor.bg}`}>
                      {t.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">{t.comprimento} m</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{t.raio} m</td>
                  <td className="px-4 py-3 font-mono text-green-400 font-semibold">{formatarVolume(vMax)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <ActionBtn title="Visualizar" onClick={() => setTanqueSelecionado(t)}>
                        <Eye className="w-3.5 h-3.5" />
                      </ActionBtn>
                      <ActionBtn title="Editar / Arqueação" onClick={() => setTanqueSelecionado(t)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {tanqueSelecionado && (
          <ModalArqueacao tanque={tanqueSelecionado} onFechar={() => setTanqueSelecionado(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Modal de Arqueação com Slider + Click-to-Edit ────────────────────────────

function ModalArqueacao({ tanque, onFechar }: { tanque: TanqueConfig; onFechar: () => void }) {
  const vMax = calcularVolumeMax(tanque.comprimento)
  const [alturaCm, setAlturaCm] = useState(127.5)  // começa no meio

  // Click-to-edit states
  const [editandoAltura, setEditandoAltura] = useState(false)
  const [editandoVolume, setEditandoVolume] = useState(false)
  const [inputAltura, setInputAltura]       = useState('')
  const [inputVolume, setInputVolume]       = useState('')

  const resultado = calcularVolume(alturaCm, tanque.comprimento)
  const cor = COR_COMBUSTIVEL[tanque.tipo]

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    setAlturaCm(parseFloat(e.target.value))
    setEditandoAltura(false)
    setEditandoVolume(false)
  }

  function commitAltura(valor: string) {
    const h = parseFloat(valor.replace(',', '.'))
    if (!isNaN(h) && h >= 0 && h <= ALTURA_MAX_CM) setAlturaCm(h)
    setEditandoAltura(false)
  }

  function commitVolume(valor: string) {
    const v = parseFloat(valor.replace(',', '.').replace(/\./g, '').replace(',', '.'))
    if (!isNaN(v) && v >= 0 && v <= vMax) {
      const h = calcularAlturaDeVolume(v, tanque.comprimento)
      setAlturaCm(h)
    }
    setEditandoVolume(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onFechar()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${cor.bg} border ${cor.border} flex items-center justify-center`}>
              <ArrowUpDown className={`w-4 h-4 ${cor.text}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{tanque.nome} — Arqueação</h3>
              <p className={`text-xs ${cor.text}`}>{tanque.tipo} · {tanque.comprimento}m</p>
            </div>
          </div>
          <button onClick={onFechar} className="p-2 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Barra de nível visual */}
          <div className="flex gap-4 items-end">
            {/* Tanque visual (representação lateral) */}
            <div className="relative w-20 h-48 rounded-2xl border-2 border-slate-600 bg-slate-800 overflow-hidden shrink-0">
              <motion.div
                className={`absolute bottom-0 w-full ${cor.bar} opacity-70`}
                animate={{ height: `${resultado.percentual}%` }}
                transition={{ duration: 0.3 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-lg">
                  {resultado.percentual.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Info e Slider */}
            <div className="flex-1 space-y-5">
              {/* Altura — Click-to-Edit */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Altura (cm)</p>
                {editandoAltura ? (
                  <input
                    type="number"
                    value={inputAltura}
                    autoFocus
                    onChange={e => setInputAltura(e.target.value)}
                    onBlur={() => commitAltura(inputAltura)}
                    onKeyDown={e => e.key === 'Enter' && commitAltura(inputAltura)}
                    className="w-full text-2xl font-bold bg-slate-800 border border-green-500/50 rounded-xl
                               px-3 py-1 text-white outline-none focus:ring-2 focus:ring-green-500/30"
                    min={0} max={ALTURA_MAX_CM} step={0.1}
                  />
                ) : (
                  <p
                    title="Clique para editar"
                    onClick={() => { setInputAltura(alturaCm.toFixed(1)); setEditandoAltura(true) }}
                    className="text-2xl font-bold text-white cursor-text hover:text-green-400 transition-colors
                               border border-transparent hover:border-green-500/30 rounded-xl px-1 py-0.5 -mx-1"
                  >
                    {alturaCm.toFixed(1)} <span className="text-sm font-normal text-slate-500">cm</span>
                  </p>
                )}
              </div>

              {/* Volume — Click-to-Edit */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Volume</p>
                {editandoVolume ? (
                  <input
                    type="number"
                    value={inputVolume}
                    autoFocus
                    onChange={e => setInputVolume(e.target.value)}
                    onBlur={() => commitVolume(inputVolume)}
                    onKeyDown={e => e.key === 'Enter' && commitVolume(inputVolume)}
                    className="w-full text-2xl font-bold bg-slate-800 border border-green-500/50 rounded-xl
                               px-3 py-1 text-green-400 outline-none focus:ring-2 focus:ring-green-500/30"
                    min={0} step={1}
                  />
                ) : (
                  <p
                    title="Clique para editar"
                    onClick={() => { setInputVolume(resultado.volumeLitros.toFixed(0)); setEditandoVolume(true) }}
                    className="text-2xl font-bold text-green-400 cursor-text hover:text-green-300 transition-colors
                               border border-transparent hover:border-green-500/30 rounded-xl px-1 py-0.5 -mx-1"
                  >
                    {formatarVolume(resultado.volumeLitros)}
                  </p>
                )}
              </div>

              {/* Vol. máximo */}
              <p className="text-xs text-slate-600">Vol. máximo: {formatarVolume(vMax)}</p>
            </div>
          </div>

          {/* Slider "Sobe e Desce" */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Simulador de Nível</label>
              <span className="text-xs font-mono text-slate-400">0 – {ALTURA_MAX_CM} cm</span>
            </div>
            <input
              type="range"
              min={0}
              max={ALTURA_MAX_CM}
              step={0.5}
              value={alturaCm}
              onChange={handleSlider}
              className="w-full h-2 rounded-full appearance-none cursor-pointer
                         bg-slate-700 accent-green-500"
              style={{
                background: `linear-gradient(to right, #22c55e ${resultado.percentual}%, #334155 ${resultado.percentual}%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Vazio (0 cm)</span>
              <span>Cheio ({ALTURA_MAX_CM} cm)</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 text-center">
            💡 Clique diretamente nos valores de altura ou volume para editar manualmente
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ActionBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
    >
      {children}
    </button>
  )
}
