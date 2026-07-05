import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  BridgeClient, bridgeConfig, SemLeituraError,
} from '@/lib/tls/bridgeClient'
import type { BridgeInventory } from '@/lib/tls/bridgeClient'
import { bridgeParaLeitura, getLeiturasMock, derivarAvisos } from '@/lib/tls/tlsService'
import type { LeituraTLS } from '@/lib/tls/tlsService'

export type Conexao = 'connecting' | 'live' | 'polling' | 'offline' | 'mock'

interface EstadoTanques {
  leituras: LeituraTLS[]
  readAt: string | null
  conexao: Conexao
  stale: boolean
  esperandoLeitura: boolean   // bridge 503 (subindo, sem 1ª leitura)
  erro: string | null
}

const POLL_MOCK_MS   = 5_000
const POLL_FALLBACK_MS = 30_000

/**
 * Fonte única dos tanques. Usa o bridge real (REST inicial + WS tempo real +
 * fallback de polling) quando configurado; senão, cai no mock de demonstração.
 */
export function useTanques() {
  const cfg = useMemo(() => bridgeConfig(), [])
  const usandoBridge = Boolean(cfg)

  const [estado, setEstado] = useState<EstadoTanques>({
    leituras: [], readAt: null,
    conexao: usandoBridge ? 'connecting' : 'mock',
    stale: false, esperandoLeitura: false, erro: null,
  })

  const clienteRef = useRef<BridgeClient | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const vivoRef = useRef(true)

  // ── Caminho MOCK ──────────────────────────────────────────────────────
  const carregarMock = useCallback(async () => {
    const leituras = await getLeiturasMock()
    if (!vivoRef.current) return
    setEstado(e => ({ ...e, leituras, readAt: new Date().toISOString(), conexao: 'mock', stale: false, erro: null }))
  }, [])

  // ── Caminho BRIDGE ────────────────────────────────────────────────────
  useEffect(() => {
    vivoRef.current = true

    // Sem bridge: polling do mock e pronto
    if (!cfg) {
      carregarMock()
      const id = setInterval(carregarMock, POLL_MOCK_MS)
      return () => { vivoRef.current = false; clearInterval(id) }
    }

    const cliente = new BridgeClient(cfg)
    clienteRef.current = cliente

    const aplicar = (inv: BridgeInventory, viaWs: boolean) => {
      if (!vivoRef.current || !inv?.tanks) return
      const online = inv.status?.connected ?? true
      setEstado(e => ({
        ...e,
        leituras: inv.tanks.map(t => bridgeParaLeitura(t, inv.readAt, online)),
        readAt: inv.readAt,
        // WS = push fresco ⇒ não stale; REST usa o status do bridge
        stale: viaWs ? false : Boolean(inv.status?.stale),
        esperandoLeitura: false,
        erro: null,
      }))
    }

    const buscarRest = async () => {
      try {
        aplicar(await cliente.getTanks(), false)
      } catch (err) {
        if (!vivoRef.current) return
        if (err instanceof SemLeituraError) {
          setEstado(e => ({ ...e, esperandoLeitura: true }))
          return
        }
        setEstado(e => ({ ...e, erro: (err as Error).message }))
      }
    }

    const iniciarPolling = () => {
      if (pollRef.current) return
      setEstado(e => ({ ...e, conexao: e.leituras.length === 0 && e.erro ? 'offline' : 'polling' }))
      pollRef.current = setInterval(buscarRest, POLL_FALLBACK_MS)
    }
    const pararPolling = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }

    // 1) estado inicial via REST
    buscarRest()

    // 2) tempo real via WS
    const desinscrever = cliente.connectWs(payload => {
      if (!vivoRef.current) return
      if (payload.type === 'inventory') {
        aplicar(payload.data, true)
      } else if (payload.type === 'ws-status') {
        if (payload.data.connected) {
          setEstado(e => ({ ...e, conexao: 'live' }))
          pararPolling()
        } else {
          iniciarPolling()
        }
      }
    })

    return () => {
      vivoRef.current = false
      pararPolling()
      desinscrever()
      cliente.disconnect()
    }
  }, [cfg, carregarMock])

  // offline de verdade: sem leitura, com erro e sem WS
  useEffect(() => {
    if (estado.conexao === 'polling' && estado.leituras.length === 0 && estado.erro) {
      setEstado(e => ({ ...e, conexao: 'offline' }))
    }
  }, [estado.conexao, estado.leituras.length, estado.erro])

  const atualizar = useCallback(() => {
    if (cfg) clienteRef.current?.getTanks()
      .then(inv => setEstado(e => ({
        ...e,
        leituras: inv.tanks.map(t => bridgeParaLeitura(t, inv.readAt, inv.status?.connected ?? true)),
        readAt: inv.readAt, stale: Boolean(inv.status?.stale), esperandoLeitura: false, erro: null,
      })))
      .catch((err: Error) => {
        if (err instanceof SemLeituraError) setEstado(e => ({ ...e, esperandoLeitura: true }))
        else setEstado(e => ({ ...e, erro: err.message }))
      })
    else carregarMock()
  }, [cfg, carregarMock])

  const avisos = useMemo(() => derivarAvisos(estado.leituras), [estado.leituras])

  return { ...estado, avisos, bridge: usandoBridge, atualizar }
}
