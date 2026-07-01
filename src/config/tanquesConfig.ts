// ─────────────────────────────────────────────────────────────────────────────
// SmartTank — Configuração Central dos Tanques
// Fonte única de verdade para geometria, tipos e agrupamentos.
// ─────────────────────────────────────────────────────────────────────────────

export type TipoCombustivel =
  | 'Gasolina Comum'
  | 'Gasolina Aditivada'
  | 'Etanol'
  | 'Diesel S10'
  | 'Diesel S500'

export interface TanqueConfig {
  id: number
  nome: string
  tipo: TipoCombustivel
  comprimento: number   // metros
  raio: number          // metros — fixo 1.275
  alturaMaxCm: number   // cm     — fixo 255
  posicao?: string      // descrição opcional de localização física
}

/** Raio fixo de todos os tanques (metros) */
export const RAIO_M = 1.275

/** Altura máxima de todos os tanques (cm) */
export const ALTURA_MAX_CM = 255

/** Diâmetro = 2R em metros */
export const DIAMETRO_M = RAIO_M * 2

/**
 * Comprimentos oficiais por tanque
 * 1,2,3,4,8,9 → 12 m | 5,10 → 6 m | 6 → 2 m | 7 → 4 m
 */
const L: Record<number, number> = {
  1: 12, 2: 12, 3: 12, 4: 12,
  5: 6,
  6: 2,
  7: 4,
  8: 12, 9: 12,
  10: 6,
}

export const TANQUES: TanqueConfig[] = [
  // ── Gasolina ──────────────────────────────────────────────────────────────
  { id: 1,  nome: 'Tanque 1',  tipo: 'Gasolina Comum',     comprimento: L[1],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 2,  nome: 'Tanque 2',  tipo: 'Gasolina Aditivada', comprimento: L[2],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 3,  nome: 'Tanque 3',  tipo: 'Gasolina Comum',     comprimento: L[3],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },

  // ── Etanol ────────────────────────────────────────────────────────────────
  { id: 4,  nome: 'Tanque 4',  tipo: 'Etanol',             comprimento: L[4],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 5,  nome: 'Tanque 5',  tipo: 'Etanol',             comprimento: L[5],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },

  // ── Diesel S10 ────────────────────────────────────────────────────────────
  { id: 6,  nome: 'Tanque 6',  tipo: 'Diesel S10',         comprimento: L[6],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 7,  nome: 'Tanque 7',  tipo: 'Diesel S10',         comprimento: L[7],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 8,  nome: 'Tanque 8',  tipo: 'Diesel S10',         comprimento: L[8],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },

  // ── Diesel S500 ───────────────────────────────────────────────────────────
  { id: 9,  nome: 'Tanque 9',  tipo: 'Diesel S500',        comprimento: L[9],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 10, nome: 'Tanque 10', tipo: 'Diesel S500',        comprimento: L[10], raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
]

/** Grupos para renderização no formulário */
export const GRUPOS_COMBUSTIVEL: { tipo: TipoCombustivel; cor: string; tanques: TanqueConfig[] }[] = [
  { tipo: 'Gasolina Comum',     cor: 'yellow',  tanques: TANQUES.filter(t => t.tipo === 'Gasolina Comum') },
  { tipo: 'Gasolina Aditivada', cor: 'orange',  tanques: TANQUES.filter(t => t.tipo === 'Gasolina Aditivada') },
  { tipo: 'Etanol',             cor: 'green',   tanques: TANQUES.filter(t => t.tipo === 'Etanol') },
  { tipo: 'Diesel S10',         cor: 'blue',    tanques: TANQUES.filter(t => t.tipo === 'Diesel S10') },
  { tipo: 'Diesel S500',        cor: 'purple',  tanques: TANQUES.filter(t => t.tipo === 'Diesel S500') },
]

/** Cor Tailwind por combustível (para badge, barra, etc.) */
export const COR_COMBUSTIVEL: Record<TipoCombustivel, { text: string; border: string; bg: string; bar: string }> = {
  'Gasolina Comum':     { text: 'text-yellow-400',  border: 'border-yellow-400/30',  bg: 'bg-yellow-400/5',  bar: 'bg-yellow-400' },
  'Gasolina Aditivada': { text: 'text-orange-400',  border: 'border-orange-400/30',  bg: 'bg-orange-400/5',  bar: 'bg-orange-400' },
  'Etanol':             { text: 'text-green-400',   border: 'border-green-400/30',   bg: 'bg-green-400/5',   bar: 'bg-green-400' },
  'Diesel S10':         { text: 'text-blue-400',    border: 'border-blue-400/30',    bg: 'bg-blue-400/5',    bar: 'bg-blue-400' },
  'Diesel S500':        { text: 'text-purple-400',  border: 'border-purple-400/30',  bg: 'bg-purple-400/5',  bar: 'bg-purple-400' },
}
