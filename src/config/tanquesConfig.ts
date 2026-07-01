export type TipoCombustivel = 'Gasolina Comum' | 'Gasolina Aditivada' | 'Etanol' | 'Diesel S10' | 'Diesel S500'

export interface TanqueConfig {
  id: number
  nome: string
  tipo: TipoCombustivel
  comprimento: number  // metros
  raio: number         // metros (fixo = 1.275)
  alturaMaxCm: number  // centímetros (fixo = 255)
}

/** Raio fixo de todos os tanques (metros) */
export const RAIO_M = 1.275

/** Altura máxima de todos os tanques (cm) */
export const ALTURA_MAX_CM = 255

/**
 * Comprimentos por tanque:
 *  - 1,2,3,4,8,9 → 12 m
 *  - 5,10        →  6 m
 *  - 6           →  2 m
 *  - 7           →  4 m
 */
const comprimentoPorTanque: Record<number, number> = {
  1: 12, 2: 12, 3: 12, 4: 12,
  5: 6,
  6: 2,
  7: 4,
  8: 12, 9: 12,
  10: 6,
}

export const TANQUES: TanqueConfig[] = [
  // ── Gasolina ────────────────────────────────────────────
  { id: 1, nome: 'Tanque 1',  tipo: 'Gasolina Comum',    comprimento: comprimentoPorTanque[1],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 2, nome: 'Tanque 2',  tipo: 'Gasolina Aditivada',comprimento: comprimentoPorTanque[2],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 3, nome: 'Tanque 3',  tipo: 'Gasolina Comum',    comprimento: comprimentoPorTanque[3],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },

  // ── Etanol ──────────────────────────────────────────────
  { id: 4, nome: 'Tanque 4',  tipo: 'Etanol',             comprimento: comprimentoPorTanque[4],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 5, nome: 'Tanque 5',  tipo: 'Etanol',             comprimento: comprimentoPorTanque[5],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },

  // ── Diesel S10 ──────────────────────────────────────────
  { id: 6, nome: 'Tanque 6',  tipo: 'Diesel S10',         comprimento: comprimentoPorTanque[6],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 7, nome: 'Tanque 7',  tipo: 'Diesel S10',         comprimento: comprimentoPorTanque[7],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 8, nome: 'Tanque 8',  tipo: 'Diesel S10',         comprimento: comprimentoPorTanque[8],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },

  // ── Diesel S500 ─────────────────────────────────────────
  { id: 9, nome: 'Tanque 9',  tipo: 'Diesel S500',        comprimento: comprimentoPorTanque[9],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 10, nome: 'Tanque 10', tipo: 'Diesel S500',       comprimento: comprimentoPorTanque[10], raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
]

/** Tanques agrupados por tipo de combustível (ordem de exibição no formulário) */
export const GRUPOS_COMBUSTIVEL: { tipo: TipoCombustivel; tanques: TanqueConfig[] }[] = [
  { tipo: 'Gasolina Comum',    tanques: TANQUES.filter(t => t.tipo === 'Gasolina Comum') },
  { tipo: 'Gasolina Aditivada',tanques: TANQUES.filter(t => t.tipo === 'Gasolina Aditivada') },
  { tipo: 'Etanol',            tanques: TANQUES.filter(t => t.tipo === 'Etanol') },
  { tipo: 'Diesel S10',        tanques: TANQUES.filter(t => t.tipo === 'Diesel S10') },
  { tipo: 'Diesel S500',       tanques: TANQUES.filter(t => t.tipo === 'Diesel S500') },
]
