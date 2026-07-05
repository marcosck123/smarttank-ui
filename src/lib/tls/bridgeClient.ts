/**
 * Client da API do SmartTank Bridge (REST + WebSocket).
 *
 * O bridge é um serviço Node em Docker que roda no PC do posto, lê o medidor
 * Veeder-Root TLS-450 PLUS e expõe os dados na rede local. Este client é o
 * lado do consumo: REST para o estado inicial + WS para tempo real, com
 * reconexão automática (backoff até 30s).
 *
 * Porta TS do arquivo de referência bridgeClient.js, adaptado às convenções
 * do projeto (tipos + alias @/).
 */

/** Água acima deste limite (mm) indica sonda defeituosa → leitura não confiável. */
export const WATER_HEIGHT_LIMIT_MM = 100

export interface BridgeTank {
  tank: number
  productCode: number
  productLabel: string
  statusBits: string
  volume: number        // litros
  volumeTC: number      // litros (termo-compensado)
  ullage: number        // litros (espaço livre)
  height: number        // mm
  waterHeight: number   // mm
  temperature: number   // °C
  waterVolume: number   // litros
}

export interface BridgeStatus {
  connected: boolean
  stale: boolean
  lastReadAt: string | null
  consecutiveFailures: number
  lastError: string | null
}

export interface BridgeInventory {
  deviceTimestamp?: string
  readAt: string
  tanks: BridgeTank[]
  status?: BridgeStatus
}

export type BridgePayload =
  | { type: 'inventory'; data: BridgeInventory }
  | { type: 'ws-status'; data: { connected: boolean } }

/** Regra de negócio validada no posto: sonda com água > 100mm = não confiável. */
export function isTankUnreliable(tank: BridgeTank): boolean {
  return tank.waterHeight > WATER_HEIGHT_LIMIT_MM
}

/** % de ocupação do tanque (volume / capacidade total). */
export function fillPercent(tank: BridgeTank): number {
  const capacidade = tank.volume + tank.ullage
  if (!capacidade) return 0
  return (tank.volume / capacidade) * 100
}

/** Lançado quando o bridge está de pé mas o TLS ainda não deu a 1ª leitura (503). */
export class SemLeituraError extends Error {
  code = 'NO_READING_YET' as const
  constructor(msg = 'Bridge sem leitura ainda') { super(msg) }
}

type Listener = (payload: BridgePayload) => void

export class BridgeClient {
  private baseUrl: string
  private token: string
  private ws: WebSocket | null = null
  private wsRetryDelay = 2_000
  private stopped = false
  private listeners = new Set<Listener>()

  constructor({ baseUrl, token }: { baseUrl: string; token: string }) {
    if (!baseUrl || !token) throw new Error('BridgeClient: baseUrl e token são obrigatórios')
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.token = token
  }

  // ── REST ──────────────────────────────────────────────────────────────

  async getHealth(): Promise<BridgeStatus & { ok: boolean; uptimeSec: number }> {
    const res = await fetch(`${this.baseUrl}/health`)
    if (!res.ok) throw new Error(`health HTTP ${res.status}`)
    return res.json()
  }

  /** Estado atual dos tanques (cache do bridge, ~20s de frescor). */
  async getTanks(): Promise<BridgeInventory> {
    const res = await fetch(`${this.baseUrl}/tanques`, {
      headers: { 'x-api-key': this.token },
    })
    if (res.status === 503) {
      const body = await res.json().catch(() => ({}))
      throw new SemLeituraError(body?.error)
    }
    if (res.status === 401) throw new Error('Token do bridge inválido')
    if (!res.ok) throw new Error(`tanques HTTP ${res.status}`)
    return res.json()
  }

  // ── WebSocket (tempo real) ─────────────────────────────────────────────

  /** Conecta no WS com reconexão automática. Retorna função para desinscrever. */
  connectWs(onMessage: Listener): () => void {
    this.listeners.add(onMessage)
    if (!this.ws) this.openWs()
    return () => {
      this.listeners.delete(onMessage)
      if (this.listeners.size === 0) this.disconnect()
    }
  }

  private openWs() {
    if (this.stopped) return
    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + `/ws?token=${encodeURIComponent(this.token)}`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      this.wsRetryDelay = 2_000
      this.emit({ type: 'ws-status', data: { connected: true } })
    }

    this.ws.onmessage = (event) => {
      try { this.emit(JSON.parse(event.data)) } catch { /* frame inválido: ignora */ }
    }

    this.ws.onclose = () => {
      this.ws = null
      this.emit({ type: 'ws-status', data: { connected: false } })
      if (!this.stopped && this.listeners.size > 0) {
        setTimeout(() => this.openWs(), this.wsRetryDelay)
        this.wsRetryDelay = Math.min(this.wsRetryDelay * 2, 30_000)
      }
    }

    this.ws.onerror = () => { this.ws?.close() }
  }

  private emit(payload: BridgePayload) {
    for (const fn of this.listeners) fn(payload)
  }

  disconnect() {
    this.stopped = true
    this.ws?.close()
    this.ws = null
  }
}

/** true se as variáveis de ambiente do bridge estão configuradas. */
export function bridgeConfig(): { baseUrl: string; token: string } | null {
  const baseUrl = import.meta.env.VITE_BRIDGE_URL
  const token = import.meta.env.VITE_BRIDGE_TOKEN
  return baseUrl && token ? { baseUrl, token } : null
}
