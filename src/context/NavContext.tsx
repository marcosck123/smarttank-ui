import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

export type Pagina =
  | 'dashboard'
  | 'lancamento'
  | 'relatorios_stock'
  | 'gestao_tanques'
  | 'nota'

interface NavContextValue {
  paginaAtiva: Pagina
  navegar: (pagina: Pagina) => void
}

const NavContext = createContext<NavContextValue | null>(null)

export function NavProvider({ children }: { children: ReactNode }) {
  const { isDev } = useAuth()
  const [paginaAtiva, setPaginaAtiva] = useState<Pagina>(isDev ? 'dashboard' : 'lancamento')

  const navegar = useCallback((pagina: Pagina) => setPaginaAtiva(pagina), [])

  return (
    <NavContext.Provider value={{ paginaAtiva, navegar }}>
      {children}
    </NavContext.Provider>
  )
}

export function useNav() {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav deve ser usado dentro de NavProvider')
  return ctx
}
