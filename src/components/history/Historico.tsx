import { Eye, Download, Trash2, Inbox, RefreshCw, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Medicao } from '@/types'
import { gerarPlanilha } from '@/lib/gerarPlanilha'

interface Props {
  historico: Medicao[]
  carregando: boolean
  onVisualizar: (medicao: Medicao) => void
  onExcluir: (id: string) => void
  onRecarregar: () => void
}

export function Historico({ historico, carregando, onVisualizar, onExcluir, onRecarregar }: Props) {
  const totalPorMedicao = (m: Medicao) =>
    m.leituras.reduce((acc, l) => acc + l.volumeLitros, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brown-900 flex items-center gap-2">
          Histórico de Medições
          {!carregando && (
            <span className="text-xs bg-brown-100 border border-brown-200 text-brown-500 rounded-full px-2 py-0.5">
              {historico.length}
            </span>
          )}
        </h2>
        <button
          onClick={onRecarregar}
          disabled={carregando}
          title="Recarregar do Supabase"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-brown-400
                     hover:text-brown-800 hover:bg-brown-100 disabled:opacity-50 transition-colors"
        >
          {carregando
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />}
          Atualizar
        </button>
      </div>

      {carregando && historico.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-brown-300">
          <Loader2 className="w-10 h-10 mb-4 animate-spin" />
          <p className="text-sm">Carregando histórico…</p>
        </div>
      ) : historico.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-brown-300">
          <Inbox className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium">Nenhuma medição registrada</p>
          <p className="text-sm mt-1">As medições emitidas aparecem aqui.</p>
        </div>
      ) : (
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
                <tr
                  key={m.id}
                  className={`border-b border-brown-100 ${i % 2 === 0 ? 'bg-white' : 'bg-brown-50/40'}`}
                >
                  <td className="px-4 py-3 text-brown-800 font-mono text-xs">
                    {format(new Date(m.dataHora), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-brown-700">{m.operador}</td>
                  <td className="px-4 py-3 font-mono font-bold text-brown-900">
                    {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1 }).format(totalPorMedicao(m))}
                  </td>
                  <td className="px-4 py-3 text-brown-400 text-xs max-w-xs truncate">
                    {m.observacoes || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <ActionBtn title="Visualizar" onClick={() => onVisualizar(m)}>
                        <Eye className="w-3.5 h-3.5" />
                      </ActionBtn>
                      <ActionBtn title="Reemitir download" onClick={() => gerarPlanilha(m)}>
                        <Download className="w-3.5 h-3.5" />
                      </ActionBtn>
                      <ActionBtn
                        title="Excluir"
                        onClick={() => { if (confirm('Excluir esta medição? Esta ação também remove do Supabase.')) onExcluir(m.id) }}
                        danger
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ActionBtn({
  children, title, onClick, danger,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  danger?: boolean
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
