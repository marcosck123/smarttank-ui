/**
 * Camada de integração com o console TLS-450 Plus (Veeder-Root).
 *
 * ARQUITETURA PLUGÁVEL:
 *   A UI depende apenas da interface `TLSAdapter`. Hoje usamos o `mockAdapter`
 *   (dados simulados "ao vivo"). Quando o endpoint real estiver disponível
 *   (agente local → Supabase, ou HTTP direto do console), basta implementar
 *   `httpAdapter` e trocar aqui — nenhum componente muda.
 *
 * O TLS-450 responde ao comando de inventário I20200 com: nível de produto,
 * volume, volume vazio (ullage), água e temperatura por tanque.
 */

import { TANQUES } from '@/config/tanquesConfig'
import type { TipoCombustivel } from '@/config/tanquesConfig'
import { getVolume, getVolumeMax } from '@/lib/arqueacao/arqueacaoService'

export interface LeituraTLS {
  tanqueId: number
  nome: string
  tipo: TipoCombustivel
  alturaProdutoCm: number
  alturaAguaCm: number
  volumeLitros: number
  volumeVazioLitros: number    // ullage — espaço livre
  temperaturaC: number
  percentual: number
  atualizadoEm: string         // ISO
  online: boolean
}

export type NivelAviso = 'critico' | 'alerta' | 'info'

export interface AvisoTLS {
  id: string
  tanqueId: number
  nome: string
  tipo: TipoCombustivel
  nivel: NivelAviso
  categoria: string            // 'Água Alta' | 'Nível Baixo' | ...
  mensagem: string
  em: string                   // ISO
}

export interface TLSAdapter {
  lerTanques(): Promise<LeituraTLS[]>
}

// ── Limiares de alarme ──────────────────────────────────────────────────────

const AGUA_CRITICA_CM = 2.5
const AGUA_ALERTA_CM  = 1.5
const NIVEL_BAIXO_PCT = 15
const NIVEL_ALTO_PCT  = 92

// ── Mock adapter (dados simulados "ao vivo") ────────────────────────────────

/** Baseline determinístico por tanque (mesma base entre reloads). */
function baselineAltura(tanqueId: number): number {
  // distribui alturas entre ~60 e ~230 cm de forma estável
  const seed = (tanqueId * 47) % 100
  return 60 + (seed / 100) * 170
}

function ruido(amplitude: number): number {
  return (Math.random() * 2 - 1) * amplitude
}

export const mockAdapter: TLSAdapter = {
  async lerTanques(): Promise<LeituraTLS[]> {
    const agora = new Date().toISOString()
    return TANQUES.map(t => {
      // altura deriva levemente a cada leitura (sensação de "ao vivo")
      const altura = Math.max(1, Math.min(255, baselineAltura(t.id) + ruido(0.6)))
      const volume = getVolume(t.id, altura)
      const vMax = getVolumeMax(t.id)
      const percentual = vMax > 0 ? Math.min(100, (volume / vMax) * 100) : 0

      // água: quase sempre baixa; tanque 4 simula água alta para demonstrar alarme
      const agua = t.id === 4 ? 2.8 + ruido(0.1) : Math.max(0, 0.4 + ruido(0.3))

      return {
        tanqueId: t.id,
        nome: t.nome,
        tipo: t.tipo,
        alturaProdutoCm: Number(altura.toFixed(1)),
        alturaAguaCm: Number(agua.toFixed(1)),
        volumeLitros: Math.round(volume),
        volumeVazioLitros: Math.max(0, Math.round(vMax - volume)),
        temperaturaC: Number((23 + ruido(2)).toFixed(1)),
        percentual: Number(percentual.toFixed(1)),
        atualizadoEm: agora,
        online: true,
      }
    })
  },
}

// ── HTTP adapter (a implementar quando o endpoint real existir) ─────────────

export function criarHttpAdapter(_baseUrl: string): TLSAdapter {
  return {
    async lerTanques() {
      throw new Error('httpAdapter ainda não implementado — configure o agente TLS.')
    },
  }
}

// ── Seleção do adapter ativo ────────────────────────────────────────────────

const modo = (import.meta.env.VITE_TLS_MODE as string | undefined) ?? 'mock'
const baseUrl = import.meta.env.VITE_TLS_URL as string | undefined

export const tlsAdapter: TLSAdapter =
  modo === 'http' && baseUrl ? criarHttpAdapter(baseUrl) : mockAdapter

// ── API pública ─────────────────────────────────────────────────────────────

export function getLeiturasTLS(): Promise<LeituraTLS[]> {
  return tlsAdapter.lerTanques()
}

/** Deriva avisos/alarmes a partir das leituras. */
export function derivarAvisos(leituras: LeituraTLS[]): AvisoTLS[] {
  const avisos: AvisoTLS[] = []
  const push = (l: LeituraTLS, nivel: NivelAviso, categoria: string, mensagem: string) =>
    avisos.push({
      id: `${l.tanqueId}-${categoria}`,
      tanqueId: l.tanqueId, nome: l.nome, tipo: l.tipo,
      nivel, categoria, mensagem, em: l.atualizadoEm,
    })

  for (const l of leituras) {
    if (!l.online) { push(l, 'critico', 'Sensor', 'Sonda sem comunicação com o console.'); continue }
    if (l.alturaAguaCm >= AGUA_CRITICA_CM) push(l, 'critico', 'Água Alta', `Água em ${l.alturaAguaCm.toFixed(1)} cm — acima do limite.`)
    else if (l.alturaAguaCm >= AGUA_ALERTA_CM) push(l, 'alerta', 'Água', `Água em ${l.alturaAguaCm.toFixed(1)} cm — monitorar.`)
    if (l.percentual <= NIVEL_BAIXO_PCT) push(l, 'alerta', 'Nível Baixo', `Nível em ${l.percentual.toFixed(0)}% — reabastecer.`)
    if (l.percentual >= NIVEL_ALTO_PCT) push(l, 'info', 'Nível Alto', `Nível em ${l.percentual.toFixed(0)}% — quase cheio.`)
  }

  const ordem: Record<NivelAviso, number> = { critico: 0, alerta: 1, info: 2 }
  return avisos.sort((a, b) => ordem[a.nivel] - ordem[b.nivel])
}
