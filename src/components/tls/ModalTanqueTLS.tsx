import { motion } from 'framer-motion'
import { X, Droplets, Thermometer, Gauge, Waves, ArrowDownToLine, Clock, ShieldAlert } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { corCombustivel } from '@/config/tanquesConfig'
import { formatarVolume } from '@/lib/calcVolume'
import type { LeituraTLS } from '@/lib/tls/tlsService'

interface Props {
  leitura: LeituraTLS
  onFechar: () => void
}

export function ModalTanqueTLS({ leitura, onFechar }: Props) {
  const cor = corCombustivel(leitura.tipo)
  const confiavel = leitura.confiavel

  const items = [
    { icon: <Gauge className="w-4 h-4" />,          label: 'Nível de produto', valor: `${leitura.alturaProdutoCm.toFixed(1)} cm` },
    { icon: <Waves className="w-4 h-4" />,          label: 'Nível de água',    valor: `${leitura.alturaAguaCm.toFixed(1)} cm`, alerta: !confiavel || leitura.alturaAguaCm >= 2.5 },
    { icon: <Droplets className="w-4 h-4" />,       label: 'Volume atual',     valor: formatarVolume(leitura.volumeLitros), tachado: !confiavel },
    { icon: <ArrowDownToLine className="w-4 h-4" />,label: 'Espaço vazio',     valor: formatarVolume(leitura.volumeVazioLitros) },
    { icon: <Thermometer className="w-4 h-4" />,    label: 'Temperatura',      valor: `${leitura.temperaturaC.toFixed(1)} °C` },
  ]
  if (leitura.volumeTCLitros !== undefined) {
    items.splice(3, 0, { icon: <Droplets className="w-4 h-4" />, label: 'Volume TC', valor: formatarVolume(leitura.volumeTCLitros), tachado: !confiavel })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-900/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onFechar()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl bg-white border border-brown-200 shadow-warm-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${cor.dot}`} />
            <div>
              <h3 className="text-base font-bold text-brown-900">{leitura.nome}</h3>
              <p className="text-xs text-brown-400">{leitura.tipo}</p>
            </div>
          </div>
          <button onClick={onFechar} className="p-2 rounded-xl hover:bg-brown-50 text-brown-400 hover:text-brown-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aviso de leitura não confiável */}
        {!confiavel && (
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <ShieldAlert className="w-4 h-4 mt-px shrink-0" />
            <p>
              Leitura <strong>não confiável</strong>: água em {(leitura.aguaMm / 10).toFixed(1)} cm
              ({leitura.aguaMm.toFixed(0)} mm) sugere sonda com defeito. Não considere o volume.
            </p>
          </div>
        )}

        <div className="p-6">
          <div className="flex gap-5">
            <div className={`relative w-24 h-56 rounded-2xl border-2 overflow-hidden shrink-0
              ${confiavel ? 'border-brown-200 bg-brown-50' : 'border-red-200 bg-red-50'}`}>
              <motion.div
                className={`absolute bottom-0 w-full ${confiavel ? cor.barra : 'bg-red-300'} opacity-70`}
                initial={{ height: 0 }} animate={{ height: `${confiavel ? leitura.percentual : 0}%` }}
                transition={{ duration: 0.4 }}
              />
              {leitura.alturaAguaCm > 0 && confiavel && (
                <div className="absolute bottom-0 w-full bg-blue-400/40"
                  style={{ height: `${Math.min(12, (leitura.alturaAguaCm / 255) * 100 + 2)}%` }} />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-brown-900 drop-shadow">
                  {confiavel ? `${leitura.percentual.toFixed(0)}%` : '?'}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              {items.map(it => (
                <div key={it.label} className="flex items-center gap-2.5">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                    ${it.alerta ? 'bg-red-50 text-red-500' : 'bg-brown-50 text-brown-500'}`}>
                    {it.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-brown-400">{it.label}</p>
                    <p className={`text-sm font-semibold font-mono
                      ${it.alerta ? 'text-red-600' : 'text-brown-800'} ${it.tachado ? 'line-through opacity-60' : ''}`}>
                      {it.valor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5 text-[11px] text-brown-400 justify-center">
            <Clock className="w-3 h-3" />
            Leitura {format(new Date(leitura.atualizadoEm), 'HH:mm:ss', { locale: ptBR })} · TLS-450 Plus
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
