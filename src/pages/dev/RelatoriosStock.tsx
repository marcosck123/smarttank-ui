import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, RefreshCw, Loader2, Inbox, ArrowRight, FlaskConical, Fuel,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { COR_COMBUSTIVEL } from '@/config/tanquesConfig'
import { formatarVolume } from '@/lib/calcVolume'
import { useTLS } from '@/hooks/useTLS'
import {
  carregarDescargas, registrarSnapshot, simularDescarga,
} from '@/lib/tls/descargaService'
import type { Descarga } from '@/lib/tls/descargaService'
import type { Medicao } from '@/types'

interface Props { historico: Medicao[] }

export function RelatoriosStock(_: Props) {
  const { leituras } = useTLS(8000)
  const [descargas, setDescargas] = useState<Descarga[]>([])
  const [carregando, setCarregando] = useState(true)
  const [simulando, setSimulando] = useState(false)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setDescargas(await carregarDescargas())
    setCarregando(false)
  }, [])

  useEffect(() => { recarregar() }, [recarregar])

  // A cada snapshot do TLS, detecta descargas reais (aumento de volume)
  useEffect(() => {
    if (leituras.length === 0) return
    registrarSnapshot(leituras).then(novas => {
      if (novas.length > 0) setDescargas(prev => [...novas, ...prev])
    })
  }, [leituras])

  async function handleSimular() {
    if (leituras.length === 0) return
    setSimulando(true)
    const alvo = leituras[Math.floor(Math.random() * leituras.length)]
    const nova = await simularDescarga(alvo)
    setDescargas(prev => [nova, ...prev])
    setSimulando(false)
  }

  const totalRecebido = descargas.reduce((a, d) => a + d.quantidade, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brown-600" />
          <h2 className="text-lg font-semibold text-brown-900">Relatórios de Descarga</h2>
          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-600 rounded-full px-2 py-0.5 ml-1">
            DEV
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimular}
            disabled={simulando || leituras.length === 0}
            title="Simular uma descarga (demonstração)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-brown-500
                       border border-brown-200 hover:bg-brown-50 disabled:opacity-50 transition-colors"
          >
            {simulando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
            Simular
          </button>
          <button
            onClick={recarregar}
            disabled={carregando}
            className="p-2 rounded-lg text-brown-400 hover:text-brown-800 hover:bg-brown-100 disabled:opacity-50 transition-colors"
          >
            {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <ResumoCard label="Descargas detectadas" value={String(descargas.length)}
          icon={<Fuel className="w-5 h-5 text-brown-600" />} />
        <ResumoCard label="Total recebido" value={`${totalRecebido.toLocaleString('pt-BR')} L`}
          icon={<TrendingUp className="w-5 h-5 text-green-500" />} />
        <ResumoCard label="Última descarga"
          value={descargas[0] ? format(new Date(descargas[0].dataHora), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
          icon={<ArrowRight className="w-5 h-5 text-brown-400" />} />
      </div>

      {/* Explicação */}
      <div className="text-xs text-brown-400 bg-brown-50 border border-brown-100 rounded-xl px-4 py-3">
        As descargas são reconhecidas automaticamente pela boia do TLS-450 quando o volume de um
        tanque sobe além de <strong className="text-brown-600">2.000 L</strong> entre leituras. Enquanto o console
        real não estiver ligado, use <strong className="text-brown-600">Simular</strong> para demonstrar o fluxo.
      </div>

      {/* Lista */}
      {carregando && descargas.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-brown-300">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : descargas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-brown-300">
          <Inbox className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium">Nenhuma descarga registrada</p>
          <p className="text-sm mt-1">Recebimentos de combustível aparecem aqui automaticamente.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-brown-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brown-200 bg-brown-50">
                {['Data / Hora', 'Tanque', 'Combustível', 'Antes', 'Depois', 'Recebido'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brown-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {descargas.map((d, i) => {
                const cor = COR_COMBUSTIVEL[d.tipo]
                return (
                  <motion.tr
                    key={d.id}
                    initial={i === 0 ? { backgroundColor: '#f5ede0' } : false}
                    animate={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(245,237,224,0.4)' }}
                    transition={{ duration: 1.2 }}
                    className="border-b border-brown-100"
                  >
                    <td className="px-4 py-3 text-brown-800 font-mono text-xs">
                      {format(new Date(d.dataHora), 'dd/MM/yy HH:mm', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-brown-900">{d.nome}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cor.badge}`}>
                        {d.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brown-400">{formatarVolume(d.volumeAntes)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-brown-600">{formatarVolume(d.volumeDepois)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-green-600">
                      +{d.quantidade.toLocaleString('pt-BR')} L
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ResumoCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brown-200 bg-white p-5 shadow-warm-sm">
      <div className="mb-3">{icon}</div>
      <p className="text-2xl font-bold text-brown-900">{value}</p>
      <p className="text-xs text-brown-400 mt-1">{label}</p>
    </div>
  )
}
