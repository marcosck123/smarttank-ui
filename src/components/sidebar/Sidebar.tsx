import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Fuel, ClipboardList, FileText, LayoutDashboard,
  Database, BarChart2, ChevronDown, LogOut, Zap
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { Pagina } from '@/context/NavContext'
import { useNav } from '@/context/NavContext'

const SUBITENS: { id: Pagina; label: string; icon: React.ReactNode; devOnly?: boolean }[] = [
  { id: 'lancamento',       label: 'Lançar Tanques',      icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'relatorios_stock', label: 'Relatórios de Stock',  icon: <BarChart2 className="w-4 h-4" />, devOnly: true },
]

const ITENS: { id: Pagina; label: string; emoji: string; icon: React.ReactNode; accordion?: boolean; devOnly?: boolean }[] = [
  { id: 'dashboard',      label: 'Início',           emoji: '◈',  icon: <LayoutDashboard className="w-4 h-4" />, devOnly: true },
  { id: 'lancamento',     label: 'Abastecimentos',   emoji: '⛽', icon: <Fuel className="w-4 h-4" />, accordion: true },
  { id: 'gestao_tanques', label: 'Gestão de Tanques',emoji: '🛢', icon: <Database className="w-4 h-4" />, devOnly: true },
  { id: 'nota',           label: 'Nota',             emoji: '📄', icon: <FileText className="w-4 h-4" /> },
]

export function Sidebar() {
  const { usuario, sair, isDev } = useAuth()
  const { paginaAtiva, navegar } = useNav()
  const [aberto, setAberto] = useState(
    ['lancamento', 'relatorios_stock'].includes(paginaAtiva)
  )

  const itens = ITENS.filter(i => !i.devOnly || isDev)

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-brown-200 h-screen sticky top-0">

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

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {itens.map(item => {

          if (item.accordion) {
            const subs = SUBITENS.filter(s => !s.devOnly || isDev)
            const subAtivo = subs.some(s => s.id === paginaAtiva)

            return (
              <div key="accordion">
                <button
                  onClick={() => setAberto(v => !v)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px]
                              font-medium transition-colors text-left group
                              ${subAtivo && !aberto
                                ? 'bg-brown-100 text-brown-900'
                                : 'text-brown-600 hover:text-brown-900 hover:bg-brown-50'}`}
                >
                  <span className="text-[15px]">{item.emoji}</span>
                  <span className="flex-1">{item.label}</span>
                  <motion.span animate={{ rotate: aberto ? 180 : 0 }} transition={{ duration: 0.2 }}
                    className="text-brown-300">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {aberto && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="ml-5 pl-3 border-l border-brown-200 mt-0.5 pb-1 space-y-0.5">
                        {subs.map(sub => (
                          <button key={sub.id} onClick={() => navegar(sub.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs
                                        font-medium transition-colors text-left
                                        ${paginaAtiva === sub.id
                                          ? 'bg-brown-800 text-white'
                                          : 'text-brown-500 hover:text-brown-900 hover:bg-brown-50'}`}
                          >
                            <span className={paginaAtiva === sub.id ? 'text-brown-200' : 'text-brown-400'}>
                              {sub.icon}
                            </span>
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          }

          return (
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
          )
        })}
      </nav>

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
