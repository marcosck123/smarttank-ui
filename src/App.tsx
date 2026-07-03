import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { NavProvider, useNav } from '@/context/NavContext'
import { LandingPage } from '@/components/auth/LandingPage'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { FormularioLancamento } from '@/components/forms/FormularioLancamento'
import { NotaPage } from '@/pages/NotaPage'
import { GestaoTanques } from '@/pages/dev/GestaoTanques'
import { Dashboard } from '@/pages/dev/Dashboard'
import { RelatoriosStock } from '@/pages/dev/RelatoriosStock'
import { useAppStore } from '@/store/useAppStore'

function PainelInterno() {
  const { paginaAtiva } = useNav()
  const { usuario } = useAuth()
  const { historico, statusSync, modoOffline, salvarMedicao, excluirMedicao, recarregarHistorico } = useAppStore()

  return (
    <div className="flex min-h-screen bg-brown-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barra de status de sync */}
        {modoOffline && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs">
            Modo offline — dados salvos localmente. Configure o Supabase para sincronizar.
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={paginaAtiva}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
              className="h-full p-6 lg:p-8"
            >
              {paginaAtiva === 'dashboard'       && <Dashboard historico={historico} />}
              {paginaAtiva === 'lancamento'      && <FormularioLancamento operador={usuario?.nome ?? ''} onSalvar={salvarMedicao} statusSync={statusSync} />}
              {paginaAtiva === 'relatorios_stock'&& <RelatoriosStock historico={historico} />}
              {paginaAtiva === 'gestao_tanques'  && <GestaoTanques />}
              {paginaAtiva === 'nota'            && (
                <NotaPage
                  operador={usuario?.nome ?? ''}
                  historico={historico}
                  statusSync={statusSync}
                  onSalvar={salvarMedicao}
                  onExcluir={excluirMedicao}
                  onRecarregar={recarregarHistorico}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { usuario } = useAuth()

  return (
    <AnimatePresence mode="wait">
      {!usuario ? (
        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LandingPage />
        </motion.div>
      ) : (
        <motion.div key="painel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
          <NavProvider>
            <PainelInterno />
          </NavProvider>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
