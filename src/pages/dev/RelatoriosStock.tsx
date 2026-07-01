import { BarChart2 } from 'lucide-react'
import type { Medicao } from '@/types'

interface Props { historico: Medicao[] }

export function RelatoriosStock({ historico: _ }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-brown-300">
      <BarChart2 className="w-16 h-16 mb-4 opacity-30" />
      <p className="text-xl font-semibold text-brown-400">Relatórios de Stock</p>
      <p className="text-sm mt-2">Em desenvolvimento — disponível na próxima versão.</p>
    </div>
  )
}
