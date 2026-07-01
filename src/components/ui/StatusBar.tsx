import { Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { StatusSync } from '@/store/useAppStore'

interface Props { statusSync: StatusSync; modoOffline: boolean }

export function StatusBar({ statusSync, modoOffline }: Props) {
  const base = 'flex items-center gap-2 px-5 py-1.5 text-xs border-b'

  if (modoOffline) return (
    <div className={`${base} bg-amber-50 border-amber-200 text-amber-700`}>
      <CloudOff className="w-3.5 h-3.5 shrink-0" />
      Modo offline — dados salvos localmente. Configure o Supabase para sincronizar.
    </div>
  )

  if (statusSync === 'carregando') return (
    <div className={`${base} bg-brown-50 border-brown-100 text-brown-500`}>
      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      Carregando histórico do Supabase…
    </div>
  )

  if (statusSync === 'salvando') return (
    <div className={`${base} bg-brown-50 border-brown-100 text-brown-600`}>
      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      Sincronizando com Supabase…
    </div>
  )

  if (statusSync === 'erro') return (
    <div className={`${base} bg-red-50 border-red-200 text-red-600`}>
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      Erro ao sincronizar — dados salvos localmente como backup.
    </div>
  )

  return (
    <div className={`${base} bg-brown-50 border-brown-100 text-brown-400`}>
      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
      <Cloud className="w-3.5 h-3.5 text-green-600 shrink-0" />
      Sincronizado com Supabase
    </div>
  )
}
