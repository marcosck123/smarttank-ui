import { RAIO_M, ALTURA_MAX_CM } from '@/config/tanquesConfig'

export interface ResultadoCalculo {
  volumeLitros: number
  percentual: number     // 0–100
  alturaM: number
  valido: boolean
  erro?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// CÁLCULO DIRETO: altura (cm) → volume (L)
// Fórmula de segmento circular de cilindro horizontal
// ─────────────────────────────────────────────────────────────────────────────
export function calcularVolume(alturaCm: number, comprimentoM: number): ResultadoCalculo {
  if (alturaCm < 0 || alturaCm > ALTURA_MAX_CM) {
    return { volumeLitros: 0, percentual: 0, alturaM: 0, valido: false, erro: `Altura deve estar entre 0 e ${ALTURA_MAX_CM} cm` }
  }

  const R = RAIO_M
  const L = comprimentoM
  const h = alturaCm / 100

  const argAcos  = Math.max(-1, Math.min(1, (R - h) / R))
  const radicando = Math.max(0, 2 * R * h - Math.pow(h, 2))
  const volumeLitros = L * 1000 * (Math.pow(R, 2) * Math.acos(argAcos) - (R - h) * Math.sqrt(radicando))

  const volumeMax = calcularVolumeMax(comprimentoM)
  const percentual = volumeMax > 0 ? Math.min(100, (volumeLitros / volumeMax) * 100) : 0

  return {
    volumeLitros: Math.round(volumeLitros * 10) / 10,
    percentual:   Math.round(percentual   * 10) / 10,
    alturaM: h,
    valido: true,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CÁLCULO INVERSO: volume (L) → altura (cm)
// Busca binária — não existe solução analítica fechada para h
// ─────────────────────────────────────────────────────────────────────────────
export function calcularAlturaDeVolume(volumeAlvo: number, comprimentoM: number): number {
  const vMax = calcularVolumeMax(comprimentoM)
  if (volumeAlvo <= 0)    return 0
  if (volumeAlvo >= vMax) return ALTURA_MAX_CM

  let lo = 0
  let hi = ALTURA_MAX_CM
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const v = calcularVolume(mid, comprimentoM).volumeLitros
    if (v < volumeAlvo) lo = mid
    else                hi = mid
  }
  return Math.round(((lo + hi) / 2) * 10) / 10
}

// ─────────────────────────────────────────────────────────────────────────────
// VOLUME MÁXIMO (tanque 100% cheio)
// ─────────────────────────────────────────────────────────────────────────────
export function calcularVolumeMax(comprimentoM: number): number {
  const R = RAIO_M
  const h = 2 * R
  const argAcos   = Math.max(-1, Math.min(1, (R - h) / R))
  const radicando = Math.max(0, 2 * R * h - Math.pow(h, 2))
  return comprimentoM * 1000 * (Math.pow(R, 2) * Math.acos(argAcos) - (R - h) * Math.sqrt(radicando))
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
export function formatarVolume(litros: number): string {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(litros) + ' L'
}

export function formatarNumero(n: number, casas = 1): string {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(n)
}
