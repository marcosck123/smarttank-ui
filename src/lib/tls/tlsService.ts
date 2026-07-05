/**
 * Camada de dados dos tanques (TLS-450 PLUS).
 *
 * Duas fontes, mesma forma de dados (`LeituraTLS`):
 *   • BRIDGE REAL  → quando VITE_BRIDGE_URL/TOKEN existem (ver bridgeClient/useTanques)
 *   • MOCK         → fallback de demonstração quando o bridge não está configurado
 *
 * Nenhum componente sabe de onde vêm os dados — só consome `LeituraTLS[]`.
 */

import { TANQUES } from '@/config/tanquesConfig'
import { getVolume, getVolumeMax } from '@/lib/arqueacao/arqueacaoService'
import { WATER_HEIGHT_LIMIT_MM } from './bridgeClient'
import type { BridgeTank } from './bridgeClient'

export interface LeituraTLS {
  tanqueId: number
  nome: string
  tipo: string                 // productLabel do bridge ou TipoCombustivel do mock
  alturaProdutoCm: number
  alturaAguaCm: number
  volumeLitros: number
  volumeVazioLitros: number    // ullage — espaço livre
  volumeTCLitros?: number      // termo-compensado (bridge)
  temperaturaC: number
  percentual: number
  atualizadoEm: string         // ISO
  online: boolean
  confiavel: boolean           // false quando waterHeight > 100mm (sonda suspeita)
  aguaMm: number               // altura de água em mm (para a regra de confiabilidade)
}

export type NivelAviso = 'critico' | 'alerta' | 'info'

export interface AvisoTLS {
  id: string
  tanqueId: number
  nome: string
  tipo: string
  nivel: NivelAviso
  categoria: string
  mensagem: string
  em: string
}

// ── Mapeamento bridge → LeituraTLS ──────────────────────────────────────────

/** Converte um tanque do bridge para a forma interna (mm→cm, % de ocupação). */
export function bridgeParaLeitura(t: BridgeTank, readAt: string, online: boolean): LeituraTLS {
  const capacidade = t.volume + t.ullage
  const percentual = capacidade > 0 ? Math.min(100, (t.volume / capacidade) * 100) : 0
  return {
    tanqueId: t.tank,
    nome: `Tanque ${t.tank}`,
    tipo: t.productLabel,
    alturaProdutoCm: t.height / 10,
    alturaAguaCm: t.waterHeight / 10,
    volumeLitros: t.volume,
    volumeVazioLitros: t.ullage,
    volumeTCLitros: t.volumeTC,
    temperaturaC: t.temperature,
    percentual: Number(percentual.toFixed(1)),
    atualizadoEm: readAt,
    online,
    confiavel: t.waterHeight <= WATER_HEIGHT_LIMIT_MM,
    aguaMm: t.waterHeight,
  }
}

// ── Mock (demonstração — usado só sem bridge configurado) ───────────────────

const AGUA_CRITICA_CM = 2.5
const AGUA_ALERTA_CM  = 1.5
const NIVEL_BAIXO_PCT = 15
const NIVEL_ALTO_PCT  = 92

function baselineAltura(tanqueId: number): number {
  const seed = (tanqueId * 47) % 100
  return 60 + (seed / 100) * 170
}
function ruido(amplitude: number): number {
  return (Math.random() * 2 - 1) * amplitude
}

export async function getLeiturasMock(): Promise<LeituraTLS[]> {
  const agora = new Date().toISOString()
  return TANQUES.map(t => {
    const altura = Math.max(1, Math.min(255, baselineAltura(t.id) + ruido(0.6)))
    const volume = getVolume(t.id, altura)
    const vMax = getVolumeMax(t.id)
    const percentual = vMax > 0 ? Math.min(100, (volume / vMax) * 100) : 0
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
      confiavel: true,
      aguaMm: Math.round(agua * 10),
    }
  })
}

// ── Derivação de avisos/alarmes ─────────────────────────────────────────────

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

    // Regra: sonda com água alta demais é leitura não confiável — não tratar
    // como água de verdade nem confiar no nível desse tanque.
    if (!l.confiavel) {
      push(l, 'alerta', 'Sonda', `Leitura não confiável — água em ${(l.aguaMm / 10).toFixed(0)} cm sugere sonda com defeito.`)
      continue
    }

    if (l.alturaAguaCm >= AGUA_CRITICA_CM) push(l, 'critico', 'Água Alta', `Água em ${l.alturaAguaCm.toFixed(1)} cm — acima do limite.`)
    else if (l.alturaAguaCm >= AGUA_ALERTA_CM) push(l, 'alerta', 'Água', `Água em ${l.alturaAguaCm.toFixed(1)} cm — monitorar.`)
    if (l.percentual <= NIVEL_BAIXO_PCT) push(l, 'alerta', 'Nível Baixo', `Nível em ${l.percentual.toFixed(0)}% — reabastecer.`)
    if (l.percentual >= NIVEL_ALTO_PCT) push(l, 'info', 'Nível Alto', `Nível em ${l.percentual.toFixed(0)}% — quase cheio.`)
  }

  const ordem: Record<NivelAviso, number> = { critico: 0, alerta: 1, info: 2 }
  return avisos.sort((a, b) => ordem[a.nivel] - ordem[b.nivel])
}
