import { ClipboardList, History, Fuel } from 'lucide-react'
import type { Aba } from '@/store/useAppStore'

interface Props {
  abaAtiva: Aba
  operador: string
  onNavegar: (aba: Aba) => void
}

const ABAS: { id: Aba; label: string; icon: React.ReactNode }[] = [
  { id: 'lancamento', label: 'Lançamento Atual', icon: <ClipboardList className="w-5 h-5" /> },
  { id: 'historico',  label: 'Histórico',        icon: <History className="w-5 h-5" /> },
]

export function Sidebar({ abaAtiva, operador, onNavegar }: Props) {
  return (
    <aside className="w-60 shrink-0 flex flex-col bg-surface-800 border-r border-surface-600 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-surface-600">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Fuel className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">SmartTank</p>
          <p className="text-[10px] text-surface-500 leading-tight">Medição Noturna</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {ABAS.map(aba => (
          <button
            key={aba.id}
            onClick={() => onNavegar(aba.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left
              ${abaAtiva === aba.id
                ? 'bg-brand-600/20 text-brand-500 border border-brand-500/30'
                : 'text-surface-400 hover:text-white hover:bg-surface-700'}
            `}
          >
            {aba.icon}
            {aba.label}
          </button>
        ))}
      </nav>

      {/* Operador */}
      <div className="px-4 py-4 border-t border-surface-600">
        <p className="text-[10px] text-surface-500 uppercase tracking-widest mb-1">Operador ativo</p>
        <p className="text-sm font-semibold text-white truncate">{operador}</p>
      </div>
    </aside>
  )
}
