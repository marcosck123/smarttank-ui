import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { registrarAcesso } from '@/lib/supabase/usuariosService'

export type Perfil = 'OPERADOR' | 'DESENVOLVEDOR'

export interface Usuario {
  nome: string
  perfil: Perfil
}

interface AuthContextValue {
  usuario: Usuario | null
  entrar: (nome: string, perfil: Perfil) => void
  sair: () => void
  isDev: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const SESSION_KEY = 'smarttank:usuario'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') }
    catch { return null }
  })

  const entrar = useCallback((nome: string, perfil: Perfil) => {
    const u: Usuario = { nome, perfil }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(u))
    setUsuario(u)
    // Registra o acesso e faz upsert do usuário (best-effort, não bloqueia o login)
    void registrarAcesso(nome, perfil, 'login')
  }, [])

  const sair = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair, isDev: usuario?.perfil === 'DESENVOLVEDOR' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

// Credenciais do Easter Egg — altere aqui para mudar a senha dev
export const DEV_TRIGGER_NAME = 'marcos'
export const DEV_PASSWORD     = 'admin123'
