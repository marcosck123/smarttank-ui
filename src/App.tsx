import { useState, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { TelaLogin } from '@/components/ui/TelaLogin'
import { Sidebar } from '@/components/layout/Sidebar'
import { FormularioLancamento } from '@/components/forms/FormularioLancamento'
import { Historico } from '@/components/history/Historico'
import { ModalPreview } from '@/components/preview/ModalPreview'
import { StatusBar } from '@/components/ui/StatusBar'
import { gerarPlanilha } from '@/lib/gerarPlanilha'
import type { Medicao } from '@/types'

function gerarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function App() {
  const {
    operador, salvarOperador,
    abaAtiva, setAbaAtiva,
    historico, statusSync, modoOffline,
    salvarMedicao, excluirMedicao, recarregarHistorico,
  } = useAppStore()

  const [medicaoPreview, setMedicaoPreview] = useState<Medicao | null>(null)
  const [emitindo, setEmitindo] = useState(false)

  const handlePreview = useCallback((dados: Omit<Medicao, 'id' | 'dataHora'>) => {
    setMedicaoPreview({ ...dados, id: gerarId(), dataHora: new Date().toISOString() })
  }, [])

  const handleConfirmar = useCallback(async () => {
    if (!medicaoPreview) return
    setEmitindo(true)
    try {
      await salvarMedicao(medicaoPreview)
      await gerarPlanilha(medicaoPreview)
      setMedicaoPreview(null)
    } finally {
      setEmitindo(false)
    }
  }, [medicaoPreview, salvarMedicao])

  if (!operador) {
    return <TelaLogin onEntrar={salvarOperador} />
  }

  return (
    <div className="flex min-h-screen bg-surface-900">
      <Sidebar abaAtiva={abaAtiva} operador={operador} onNavegar={setAbaAtiva} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <StatusBar statusSync={statusSync} modoOffline={modoOffline} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {abaAtiva === 'lancamento' && (
            <FormularioLancamento operador={operador} onPreview={handlePreview} />
          )}
          {abaAtiva === 'historico' && (
            <Historico
              historico={historico}
              carregando={statusSync === 'carregando'}
              onVisualizar={m => setMedicaoPreview(m)}
              onExcluir={excluirMedicao}
              onRecarregar={recarregarHistorico}
            />
          )}
        </main>
      </div>

      {medicaoPreview && (
        <ModalPreview
          medicao={medicaoPreview}
          onConfirmar={handleConfirmar}
          onFechar={() => setMedicaoPreview(null)}
          emitindo={emitindo}
        />
      )}
    </div>
  )
}
