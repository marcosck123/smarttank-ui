import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Fuel, ClipboardList, History, LayoutDashboard,
  Database, BarChart2, ChevronDown, LogOut, Zap
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { Pagina } from '@/context/NavContext'
import { useNav } from '@/context/NavContext'

interface NavItem {
  id: Pagina
  label: string
  icon: React.ReactNode
  devOnly?: boolean
}

const SUBITENS_ABASTECIMENTO: NavItem[] = [
  { id: 'lancamento',        label: 'Lançar Tanques',     icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'relatorios_stock',  label: 'Relatórios de Stock', icon: <BarChart2 className="w-4 h-4" />,    devOnly: true },
]

const ITENS_PRINCIPAIS: (NavItem & { accordion?: boolean })[] = [
  { id: 'dashboard',      label: 'Início / Dashboard',   icon: <LayoutDashboard className="w-4 h-4" />, devOnly: true },
  { id: 'lancamento',     label: 'Abastecimentos',        icon: <Fuel className="w-4 h-4" />,            accordion: true },
  { id: 'gestao_tanques', label: 'Gestão de Tanques',     icon: <Database className="w-4 h-4" />,        devOnly: true },
  { id: 'historico',      label: 'Histórico',             icon: <History className="w-4 h-4" /> },
]

export function Sidebar() {
  const { usuario, sair, isDev } = useAuth()
  const { paginaAtiva, navegar }  = useNav()
  const [abastecimentoAberto, setAbastecimentoAberto] = useState(
    ['lancamento', 'relatorios_stock'].includes(paginaAtiva)
  )

  const itensVisiveis = ITENS_PRINCIPAIS.filter(i => !i.devOnly || isDev)

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-slate-900 border-r border-slate-700/50 h-screen sticky top-0">

      {/* ── Logo ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700
                        flex items-center justify-center shadow-lg shadow-green-900/40">
          <Fuel className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">
            Smart<span className="text-green-400">Tank</span>
          </p>
          <p className="text-[10px] text-slate-500 leading-tight tracking-wide">Medição Noturna</p>
        </div>
      </div>

      {/* ── Perfil do operador ─────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/60">
          <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-green-400">
            {usuario?.nome[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{usuario?.nome}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {isDev
                ? <><Zap className="w-2.5 h-2.5 text-amber-400" /><span className="text-[9px] text-amber-400 font-bold tracking-wide">DESENVOLVEDOR</span></>
                : <span className="text-[9px] text-slate-500 tracking-wide">OPERADOR</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── Navegação ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {itensVisiveis.map(item => {

          if (item.accordion) {
            const subVisiveis = SUBITENS_ABASTECIMENTO.filter(s => !s.devOnly || isDev)
            const subAtivo    = subVisiveis.some(s => s.id === paginaAtiva)

            return (
              <div key="accordion-abastecimento">
                {/* Cabeçalho do accordion */}
                <button
                  onClick={() => setAbastecimentoAberto(v => !v)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                              transition-colors text-left group
                              ${subAtivo && !abastecimentoAberto
                                ? 'bg-green-600/15 text-green-400 border border-green-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <span className={`${subAtivo ? 'text-green-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1">⛽ {item.label}</span>
                  <motion.span
                    animate={{ rotate: abastecimentoAberto ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-slate-500"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.span>
                </button>

                {/* Subitens com animação */}
                <AnimatePresence initial={false}>
                  {abastecimentoAberto && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-0.5 pl-3 border-l border-slate-700/60 space-y-0.5 py-1">
                        {subVisiveis.map(sub => (
                          <NavBtn
                            key={sub.id}
                            item={sub}
                            ativo={paginaAtiva === sub.id}
                            onClick={() => navegar(sub.id)}
                            size="sm"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          }

          // Ícones para itens top-level
          const icons: Record<string, string> = {
            dashboard:      '📊',
            gestao_tanques: '🛢️',
            historico:      '📜',
          }

          return (
            <NavBtn
              key={item.id}
              item={{ ...item, label: `${icons[item.id] ?? ''} ${item.label}`.trim() }}
              ativo={paginaAtiva === item.id}
              onClick={() => navegar(item.id)}
            />
          )
        })}
      </nav>

      {/* ── Logout ────────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={sair}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair do sistema
        </button>
      </div>
    </aside>
  )
}

// ── Componente auxiliar de botão de navegação ─────────────────────────────

function NavBtn({
  item, ativo, onClick, size = 'md',
}: {
  item: { label: string; icon: React.ReactNode }
  ativo: boolean
  onClick: () => void
  size?: 'sm' | 'md'
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 rounded-xl font-medium
                  transition-colors text-left
                  ${size === 'sm' ? 'py-2 text-xs' : 'py-2.5 text-sm'}
                  ${ativo
                    ? 'bg-green-600/15 text-green-400 border border-green-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
    >
      <span className={ativo ? 'text-green-400' : 'text-slate-500'}>{item.icon}</span>
      {item.label}
    </button>
  )
}
