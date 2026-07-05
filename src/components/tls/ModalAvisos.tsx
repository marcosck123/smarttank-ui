import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, AlertOctagon, AlertTriangle, Info, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AvisoTLS, NivelAviso } from '@/lib/tls/tlsService'

interface Props {
  avisos: AvisoTLS[]
  onFechar: () => void
}

const ESTILO: Record<NivelAviso, { icon: React.ReactNode; card: string; badge: string; label: string }> = {
  critico: {
    icon: <AlertOctagon className="w-4 h-4" />,
    card: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-600',
    label: 'Crítico',
  },
  alerta: {
    icon: <AlertTriangle className="w-4 h-4" />,
    card: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Alerta',
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    card: 'bg-brown-50 border-brown-200',
    badge: 'bg-brown-100 text-brown-600',
    label: 'Info',
  },
}

export function ModalAvisos({ avisos, onFechar }: Props) {
  const criticos = avisos.filter(a => a.nivel === 'critico').length

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onFechar])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-900/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onFechar()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl bg-white border border-brown-200 shadow-warm-lg overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100">
          <div>
            <h3 className="text-base font-bold text-brown-900">Avisos do Sistema</h3>
            <p className="text-xs text-brown-400">
              {avisos.length === 0 ? 'Nenhum aviso ativo'
                : `${avisos.length} aviso${avisos.length > 1 ? 's' : ''}${criticos > 0 ? ` · ${criticos} crítico${criticos > 1 ? 's' : ''}` : ''}`}
            </p>
          </div>
          <button onClick={onFechar} className="p-2 rounded-xl hover:bg-brown-50 text-brown-400 hover:text-brown-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {avisos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-brown-300">
              <ShieldCheck className="w-12 h-12 mb-3 text-green-400" />
              <p className="text-sm font-medium text-brown-500">Tudo sob controle</p>
              <p className="text-xs mt-1">Nenhum alarme reportado pelo console.</p>
            </div>
          ) : (
            avisos.map(a => {
              const st = ESTILO[a.nivel]
              return (
                <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border ${st.card}`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${st.badge}`}>
                    {st.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brown-900">{a.nome}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-px rounded-full ${st.badge}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-brown-600 mt-0.5">
                      <strong>{a.categoria}:</strong> {a.mensagem}
                    </p>
                    <p className="text-[10px] text-brown-400 mt-1">
                      {format(new Date(a.em), "dd/MM 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
