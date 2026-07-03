import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, Droplets, AlertTriangle, Bell, RefreshCw,
  Loader2, Radio, Waves,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Medicao } from '@/types'
import { formatarVolume } from '@/lib/calcVolume'
import { COR_COMBUSTIVEL, type TipoCombustivel } from '@/config/tanquesConfig'
import { useTLS } from '@/hooks/useTLS'
import type { LeituraTLS } from '@/lib/tls/tlsService'
import { ModalTanqueTLS } from '@/components/tls/ModalTanqueTLS'
import { ModalAvisos } from '@/components/tls/ModalAvisos'

interface Props { historico: Medicao[] }

export function Dashboard({ historico }: Props) {
  const { leituras, avisos, carregando, atualizadoEm, atualizar } = useTLS(5000)
  const [detalhe, setDetalhe] = useState<LeituraTLS | null>(null)
  const [avisosAberto, setAvisosAberto] = useState(false)

  const totalLive = leituras.reduce((a, l) => a + l.volumeLitros, 0)
  const criticos = avisos.filter(a => a.nivel === 'critico').length
  const comAlerta = new Set(avisos.map(a => a.tanqueId)).size

  const ultima = historico[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-brown-600" />
          <h2 className="text-lg font-semibold text-brown-900">Dashboard</h2>
          <span className="ml-1 inline-flex items-center gap-1 text-[11px] text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <Radio className="w-3 h-3" /> TLS-450 ao vivo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={atualizar}
            title="Atualizar agora"
            className="p-2 rounded-lg text-brown-400 hover:text-brown-800 hover:bg-brown-100 transition-colors"
          >
            {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setAvisosAberto(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl border border-brown-200
                       text-sm font-medium text-brown-700 bg-white hover:bg-brown-50 transition-colors"
          >
            <Bell className="w-4 h-4" />
            Avisos
            {avisos.length > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full
                text-[10px] font-bold text-white flex items-center justify-center
                ${criticos > 0 ? 'bg-red-500' : 'bg-amber-500'}`}>
                {avisos.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPIs live */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Volume total (ao vivo)" value={`${Math.round(totalLive).toLocaleString('pt-BR')} L`}
          icon={<Droplets className="w-5 h-5 text-blue-500" />} />
        <KpiCard label="Tanques monitorados" value={String(leituras.length)}
          icon={<Radio className="w-5 h-5 text-green-500" />} />
        <KpiCard label="Tanques com alerta" value={String(comAlerta)}
          icon={<AlertTriangle className={`w-5 h-5 ${comAlerta > 0 ? 'text-amber-500' : 'text-brown-300'}`} />}
          alert={comAlerta > 0} />
        <KpiCard label="Alarmes críticos" value={String(criticos)}
          icon={<AlertTriangle className={`w-5 h-5 ${criticos > 0 ? 'text-red-500' : 'text-brown-300'}`} />}
          alert={criticos > 0} />
      </div>

      {/* Grid de tanques ao vivo */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-brown-400 uppercase tracking-wider">Tanques · Tempo Real</h3>
          {atualizadoEm && (
            <span className="text-[11px] text-brown-400 font-mono">
              atualizado {format(new Date(atualizadoEm), 'HH:mm:ss')}
            </span>
          )}
        </div>

        {carregando && leituras.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-brown-300">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {leituras.map(l => {
              const cor = COR_COMBUSTIVEL[l.tipo]
              const aguaAlta = l.alturaAguaCm >= 2.5
              const nivelBaixo = l.percentual <= 15
              return (
                <button
                  key={l.tanqueId}
                  onClick={() => setDetalhe(l)}
                  className="text-left rounded-2xl border border-brown-200 bg-white shadow-warm-sm p-4
                             hover:shadow-warm-md hover:border-brown-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${cor.dot}`} />
                      <span className="text-[13px] font-semibold text-brown-900 truncate">{l.nome}</span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-brown-500">{l.percentual.toFixed(0)}%</span>
                  </div>

                  {/* Tanque visual horizontal */}
                  <div className="h-2 rounded-full bg-brown-100 overflow-hidden mb-2.5">
                    <motion.div
                      className={`h-full rounded-full ${cor.barra}`}
                      animate={{ width: `${l.percentual}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>

                  <p className="text-sm font-bold font-mono text-brown-800">{formatarVolume(l.volumeLitros)}</p>
                  <p className="text-[11px] text-brown-400">{l.alturaProdutoCm.toFixed(1)} cm · {l.temperaturaC.toFixed(0)}°C</p>

                  <div className="flex items-center gap-1.5 mt-2 min-h-[16px]">
                    {aguaAlta && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-full px-1.5 py-px">
                        <Waves className="w-2.5 h-2.5" /> Água
                      </span>
                    )}
                    {nivelBaixo && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-px">
                        <AlertTriangle className="w-2.5 h-2.5" /> Baixo
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Última nota emitida */}
      {ultima && (
        <div className="rounded-2xl bg-white border border-brown-200 shadow-warm-sm p-6">
          <h3 className="text-xs font-semibold text-brown-400 uppercase tracking-wider mb-4">
            Última Nota · {format(new Date(ultima.dataHora), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
          </h3>
          <div className="space-y-3">
            {ultima.leituras.map(l => {
              const cor = COR_COMBUSTIVEL[l.tipo as TipoCombustivel]
              return (
                <div key={l.tanqueId} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-brown-400 text-right shrink-0">{l.nome}</span>
                  <div className="flex-1 h-5 rounded-full bg-brown-100 overflow-hidden relative">
                    <div className={`h-full rounded-full ${cor.barra} opacity-80 transition-all`}
                         style={{ width: `${l.percentual}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brown-800 drop-shadow">
                      {l.percentual.toFixed(1)}%
                    </span>
                  </div>
                  <span className="w-24 text-xs font-mono text-brown-800 text-right shrink-0">
                    {formatarVolume(l.volumeLitros)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modais */}
      <AnimatePresence>
        {detalhe && <ModalTanqueTLS leitura={detalhe} onFechar={() => setDetalhe(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {avisosAberto && <ModalAvisos avisos={avisos} onFechar={() => setAvisosAberto(false)} />}
      </AnimatePresence>
    </div>
  )
}

function KpiCard({ label, value, icon, alert }: { label: string; value: string; icon: React.ReactNode; alert?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-warm-sm ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-brown-200'}`}>
      <div className="mb-3">{icon}</div>
      <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-brown-900'}`}>{value}</p>
      <p className="text-xs text-brown-400 mt-1">{label}</p>
    </div>
  )
}
