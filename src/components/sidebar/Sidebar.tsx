import {
  FileText, LayoutDashboard, Database, BarChart2, LogOut, Zap, Settings,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { Pagina } from '@/context/NavContext'
import { useNav } from '@/context/NavContext'

const ITENS: { id: Pagina; label: string; emoji: string; icon: React.ReactNode; devOnly?: boolean }[] = [
  { id: 'dashboard',      label: 'Início',            emoji: '◈',  icon: <LayoutDashboard className="w-4 h-4" />, devOnly: true },
  { id: 'nota',           label: 'Nota',              emoji: '📄', icon: <FileText className="w-4 h-4" /> },
  { id: 'relatorios_stock', label: 'Relatórios',      emoji: '📈', icon: <BarChart2 className="w-4 h-4" />, devOnly: true },
  { id: 'gestao_tanques', label: 'Gestão de Tanques', emoji: '🛢', icon: <Database className="w-4 h-4" />, devOnly: true },
  { id: 'config',         label: 'Config',            emoji: '⚙️', icon: <Settings className="w-4 h-4" />, devOnly: true },
]

export function Sidebar() {
  const { usuario, sair, isDev } = useAuth()
  const { paginaAtiva, navegar } = useNav()

  const itens = ITENS.filter(i => !i.devOnly || isDev)

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-brown-200 h-screen sticky top-0">

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-brown-100">
        <div className="w-8 h-8 rounded-xl bg-brown-800 flex items-center justify-center shadow-warm-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M3 5v14a9 3 0 0018 0V5"/>
            <path d="M3 12a9 3 0 0018 0"/>
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-bold text-brown-900 leading-tight">SmartTank</p>
          <p className="text-[10px] text-brown-400 leading-tight tracking-wide">Medição Noturna</p>
        </div>
      </div>

      {/* ── Perfil ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-brown-100">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-brown-50 border border-brown-100">
          <div className="w-7 h-7 rounded-lg bg-brown-200 flex items-center justify-center
                          text-xs font-bold text-brown-700">
            {usuario?.nome[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brown-900 truncate">{usuario?.nome}</p>
            <div className="flex items-center gap-1 mt-px">
              {isDev
                ? <><Zap className="w-2.5 h-2.5 text-amber-600" /><span className="text-[9px] text-amber-600 font-bold tracking-wide">DESENVOLVEDOR</span></>
                : <span className="text-[9px] text-brown-400 tracking-wide">OPERADOR</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {itens.map(item => (
          <button key={item.id} onClick={() => navegar(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px]
                        font-medium transition-colors text-left
                        ${paginaAtiva === item.id
                          ? 'bg-brown-800 text-white'
                          : 'text-brown-600 hover:text-brown-900 hover:bg-brown-50'}`}
          >
            <span className={`text-[15px] ${paginaAtiva === item.id ? 'text-brown-200' : ''}`}>
              {item.emoji}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* ── Logout ───────────────────────────────────────────────────────── */}
      <div className="px-3 py-3 border-t border-brown-100">
        <button onClick={sair}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px]
                     text-brown-400 hover:text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" />
          Sair do sistema
        </button>
      </div>
    </aside>
  )
}
