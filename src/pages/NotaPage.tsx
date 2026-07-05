import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FileText, Plus, Eye, Pencil, Download, Trash2, Inbox, RefreshCw, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/context/AuthContext'
import { useNotaWizard } from '@/hooks/useNotaWizard'
import { NotaWizard } from '@/components/nota/NotaWizard'
import { ModalPreview } from '@/components/modals/ModalPreview'
import { ModalConfirmacao } from '@/components/modals/ModalConfirmacao'
import { gerarPlanilha } from '@/lib/gerarPlanilha'
import { registrarAcesso } from '@/lib/supabase/usuariosService'
import type { Medicao } from '@/types'
import type { StatusSync } from '@/store/useAppStore'

interface Props {
  operador: string
  historico: Medicao[]
  statusSync: StatusSync
  onSalvar: (m: Medicao) => Promise<void>
  onExcluir: (id: string) => void
  onRecarregar: () => void
}

function gerarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function NotaPage({ operador, historico, statusSync, onSalvar, onExcluir, onRecarregar }: Props) {
  const { isDev, usuario } = useAuth()
  const wizard = useNotaWizard()

  const [wizardAberto, setWizardAberto] = useState(false)
  const [editandoId, setEditandoId]     = useState<string | null>(null)
  const [preview, setPreview]           = useState<Medicao | null>(null)
  const [confirming, setConfirming]     = useState(false)
  const [emitindo, setEmitindo]         = useState(false)

  const carregando = statusSync === 'carregando'

  function novaNota() {
    wizard.resetar()
    setEditandoId(null)
    setWizardAberto(true)
  }

  function editarNota(m: Medicao) {
    wizard.carregar(m.leituras, m.observacoes)
    setEditandoId(m.id)
    setWizardAberto(true)
  }

  function revisar() {
    const medicao: Medicao = {
      id: editandoId ?? gerarId(),
      dataHora: new Date().toISOString(),
      operador,
      leituras: wizard.leituras,
      observacoes: wizard.observacoes,
    }
    setPreview(medicao)
  }

  async function confirmar() {
    if (!preview) return
    setEmitindo(true)
    try {
      await onSalvar(preview)
      await gerarPlanilha(preview)
      void registrarAcesso(preview.operador, usuario?.perfil ?? 'OPERADOR', 'emissao_nota')
      setConfirming(false)
      setPreview(null)
      setWizardAberto(false)
      wizard.resetar()
      setEditandoId(null)
    } finally {
      setEmitindo(false)
    }
  }

  const totalPorMedicao = (m: Medicao) => m.leituras.reduce((acc, l) => acc + l.volumeLitros, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brown-600" />
          <h2 className="text-lg font-semibold text-brown-900">Notas de Aferição</h2>
          {!carregando && (
            <span className="text-xs bg-brown-100 border border-brown-200 text-brown-500 rounded-full px-2 py-0.5">
              {historico.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRecarregar}
            disabled={carregando}
            title="Recarregar"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-brown-400
                       hover:text-brown-800 hover:bg-brown-100 disabled:opacity-50 transition-colors"
          >
            {carregando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
          <button onClick={novaNota} className="btn-primary px-4 py-2">
            <Plus className="w-4 h-4" /> Nova Nota
          </button>
        </div>
      </div>

      {/* Histórico de notas emitidas */}
      {carregando && historico.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-brown-300">
          <Loader2 className="w-10 h-10 mb-4 animate-spin" />
          <p className="text-sm">Carregando notas…</p>
        </div>
      ) : historico.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-brown-300">
          <Inbox className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium">Nenhuma nota emitida</p>
          <p className="text-sm mt-1">Clique em “Nova Nota” para começar a aferição.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold text-brown-400 uppercase tracking-wider">
            Histórico de notas emitidas
          </h3>
          <div className="overflow-x-auto rounded-xl border border-brown-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brown-200 bg-brown-50">
                {['Data / Hora', 'Operador', 'Total (L)', 'Observações', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brown-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historico.map((m, i) => (
                <tr key={m.id} className={`border-b border-brown-100 ${i % 2 === 0 ? 'bg-white' : 'bg-brown-50/40'}`}>
                  <td className="px-4 py-3 text-brown-800 font-mono text-xs">
                    {format(new Date(m.dataHora), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-brown-700">{m.operador}</td>
                  <td className="px-4 py-3 font-mono font-bold text-brown-900">
                    {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1 }).format(totalPorMedicao(m))}
                  </td>
                  <td className="px-4 py-3 text-brown-400 text-xs max-w-xs truncate">{m.observacoes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <ActionBtn title="Visualizar" onClick={() => setPreview(m)}>
                        <Eye className="w-3.5 h-3.5" />
                      </ActionBtn>
                      {isDev && (
                        <ActionBtn title="Editar / Corrigir" onClick={() => editarNota(m)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </ActionBtn>
                      )}
                      <ActionBtn title="Baixar planilha" onClick={() => gerarPlanilha(m)}>
                        <Download className="w-3.5 h-3.5" />
                      </ActionBtn>
                      {isDev && (
                        <ActionBtn
                          title="Excluir"
                          danger
                          onClick={() => { if (confirm('Excluir esta nota? Também remove do Supabase.')) onExcluir(m.id) }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </ActionBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Wizard passo-a-passo */}
      <AnimatePresence>
        {wizardAberto && (
          <NotaWizard
            wizard={wizard}
            onFechar={() => setWizardAberto(false)}
            onRevisar={revisar}
          />
        )}
      </AnimatePresence>

      {/* Prévia (mesmo fluxo de sempre) */}
      <AnimatePresence>
        {preview && (
          <ModalPreview
            medicao={preview}
            onEmitir={() => setConfirming(true)}
            onFechar={() => setPreview(null)}
          />
        )}
      </AnimatePresence>

      {/* Confirmação sobreposta */}
      <AnimatePresence>
        {confirming && (
          <ModalConfirmacao
            emitindo={emitindo}
            onConfirmar={confirmar}
            onCancelar={() => setConfirming(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ActionBtn({ children, title, onClick, danger }: {
  children: React.ReactNode; title: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-colors
        ${danger
          ? 'text-red-400 hover:bg-red-50 hover:text-red-600'
          : 'text-brown-400 hover:bg-brown-100 hover:text-brown-800'}`}
    >
      {children}
    </button>
  )
}
