import { Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { StatusSync } from '@/store/useAppStore'

interface Props {
  statusSync: StatusSync
  modoOffline: boolean
}

export function StatusBar({ statusSync, modoOffline }: Props) {
  if (modoOffline) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-yellow-950/60 border-b border-yellow-800/40 text-yellow-400 text-xs">
        <CloudOff className="w-3.5 h-3.5" />
        Modo offline — dados salvos localmente. Configure o Supabase para sincronizar na nuvem.
      </div>
    )
  }

  if (statusSync === 'carregando') {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-800 border-b border-surface-600 text-surface-400 text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Carregando histórico do Supabase…
      </div>
    )
  }

  if (statusSync === 'salvando') {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-800 border-b border-surface-600 text-brand-400 text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Sincronizando com Supabase…
      </div>
    )
  }

  if (statusSync === 'erro') {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-red-950/50 border-b border-red-800/40 text-red-400 text-xs">
        <AlertCircle className="w-3.5 h-3.5" />
        Erro ao sincronizar — dados salvos localmente como backup.
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-800 border-b border-surface-600 text-surface-500 text-xs">
      <Cloud className="w-3.5 h-3.5 text-brand-500" />
      <CheckCircle2 className="w-3 h-3 text-brand-500" />
      Sincronizado com Supabase
    </div>
  )
}
