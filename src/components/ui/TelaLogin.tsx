import { useState } from 'react'
import { Fuel, ArrowRight } from 'lucide-react'

interface Props {
  onEntrar: (nome: string) => void
}

export function TelaLogin({ onEntrar }: Props) {
  const [nome, setNome] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nome.trim()
    if (trimmed.length < 2) return
    onEntrar(trimmed)
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mb-4 shadow-lg shadow-brand-600/30">
            <Fuel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SmartTank</h1>
          <p className="text-surface-500 text-sm mt-1">Sistema de Medição de Tanques</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-surface-800 border border-surface-600 p-6 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-1">Identificação do Operador</h2>
          <p className="text-xs text-surface-500 mb-5">Informe seu nome para iniciar o turno.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1.5">
                Nome completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: João Silva"
                autoFocus
                className="w-full rounded-xl bg-surface-700 border border-surface-600 px-4 py-3
                           text-white placeholder-surface-500 text-sm outline-none
                           focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={nome.trim().length < 2}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                         bg-brand-600 text-white font-semibold text-sm
                         hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Entrar no Sistema
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-surface-600 mt-6">
          Medição das 00:00 — Turno Noturno
        </p>
      </div>
    </div>
  )
}
