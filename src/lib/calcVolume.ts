import { RAIO_M, ALTURA_MAX_CM } from '@/config/tanquesConfig'

export interface ResultadoCalculo {
  volumeLitros: number
  percentual: number    // 0–100
  valido: boolean
  erro?: string
}

/**
 * Calcula o volume de um tanque cilíndrico horizontal (segmento circular).
 *
 * Fórmula (adaptada do Excel):
 *   V(L) = L × 1000 × [ R² × acos((R−h)/R) − (R−h) × √(2Rh − h²) ]
 *
 * Onde:
 *   R = raio em metros (1.275 m)
 *   L = comprimento em metros
 *   h = altura do líquido em metros
 */
export function calcularVolume(alturaCm: number, comprimentoM: number): ResultadoCalculo {
  if (alturaCm < 0 || alturaCm > ALTURA_MAX_CM) {
    return {
      volumeLitros: 0,
      percentual: 0,
      valido: false,
      erro: `Altura deve estar entre 0 e ${ALTURA_MAX_CM} cm`,
    }
  }

  const R = RAIO_M
  const L = comprimentoM
  const h = alturaCm / 100  // converte cm → metros

  const argAcos = Math.max(-1, Math.min(1, (R - h) / R))
  const radicando = Math.max(0, 2 * R * h - Math.pow(h, 2))

  const volumeLitros =
    L * 1000 * (Math.pow(R, 2) * Math.acos(argAcos) - (R - h) * Math.sqrt(radicando))

  // Volume máximo (tanque cheio, h = diâmetro = 2R)
  const volumeMax = calcularVolumeMax(comprimentoM)
  const percentual = volumeMax > 0 ? Math.min(100, (volumeLitros / volumeMax) * 100) : 0

  return {
    volumeLitros: Math.round(volumeLitros * 10) / 10,   // 1 casa decimal
    percentual: Math.round(percentual * 10) / 10,
    valido: true,
  }
}

/** Volume máximo teórico do tanque (tanque 100% cheio) */
export function calcularVolumeMax(comprimentoM: number): number {
  const R = RAIO_M
  const h = 2 * R  // diâmetro = altura máxima real do cilindro
  const argAcos = Math.max(-1, Math.min(1, (R - h) / R))
  const radicando = Math.max(0, 2 * R * h - Math.pow(h, 2))
  return comprimentoM * 1000 * (Math.pow(R, 2) * Math.acos(argAcos) - (R - h) * Math.sqrt(radicando))
}

/** Formata volume para exibição amigável */
export function formatarVolume(litros: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(litros) + ' L'
}
