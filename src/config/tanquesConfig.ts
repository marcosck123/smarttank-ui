// ─────────────────────────────────────────────────────────────────────────────
// SmartTank — Configuração Central dos Tanques
//
// A ARQUEAÇÃO funciona como uma lookup table:
//   tabela[tanqueId][alturaCm] = volumeLitros
//
// Os valores padrão são gerados pela fórmula cilíndrica horizontal.
// O Dev pode sobrescrever qualquer linha (altura → volume) via Gestão de Tanques.
// Esses overrides são persistidos no Supabase / localStorage e mesclados na
// inicialização. O operador sempre lê o valor final mesclado — nunca recalcula.
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
  comprimento: number    // metros
  raio: number           // metros — fixo 1.275 para todos
  alturaMaxCm: number    // cm     — fixo 255 para todos
}

/** Geometria fixa de todos os tanques */
export const RAIO_M        = 1.275
export const ALTURA_MAX_CM = 255
export const DIAMETRO_M    = RAIO_M * 2

/**
 * Comprimentos oficiais:
 *   1,2,3,4,8,9 → 12 m
 *   5,10        →  6 m
 *   6           →  2 m
 *   7           →  4 m
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
  { id: 1,  nome: 'Tanque 1',  tipo: 'Gasolina Comum',     comprimento: L[1],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 2,  nome: 'Tanque 2',  tipo: 'Gasolina Aditivada', comprimento: L[2],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 3,  nome: 'Tanque 3',  tipo: 'Gasolina Comum',     comprimento: L[3],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 4,  nome: 'Tanque 4',  tipo: 'Etanol',             comprimento: L[4],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 5,  nome: 'Tanque 5',  tipo: 'Etanol',             comprimento: L[5],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 6,  nome: 'Tanque 6',  tipo: 'Diesel S10',         comprimento: L[6],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 7,  nome: 'Tanque 7',  tipo: 'Diesel S10',         comprimento: L[7],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 8,  nome: 'Tanque 8',  tipo: 'Diesel S10',         comprimento: L[8],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 9,  nome: 'Tanque 9',  tipo: 'Diesel S500',        comprimento: L[9],  raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
  { id: 10, nome: 'Tanque 10', tipo: 'Diesel S500',        comprimento: L[10], raio: RAIO_M, alturaMaxCm: ALTURA_MAX_CM },
]

// ── Agrupamento por combustível ───────────────────────────────────────────────

export const GRUPOS_COMBUSTIVEL: { tipo: TipoCombustivel; tanques: TanqueConfig[] }[] = [
  { tipo: 'Gasolina Comum',     tanques: TANQUES.filter(t => t.tipo === 'Gasolina Comum') },
  { tipo: 'Gasolina Aditivada', tanques: TANQUES.filter(t => t.tipo === 'Gasolina Aditivada') },
  { tipo: 'Etanol',             tanques: TANQUES.filter(t => t.tipo === 'Etanol') },
  { tipo: 'Diesel S10',         tanques: TANQUES.filter(t => t.tipo === 'Diesel S10') },
  { tipo: 'Diesel S500',        tanques: TANQUES.filter(t => t.tipo === 'Diesel S500') },
]

// ── Tipagem da matriz de arqueação ────────────────────────────────────────────

/**
 * Tabela de arqueação de um tanque:
 *   chave  = altura em cm (inteiro 1–255)
 *   valor  = volume em litros (pode ser padrão ou override do Dev)
 */
export type TabelaArqueacao = Record<number, number>

/**
 * Matriz completa de todos os tanques:
 *   chave  = tanqueId (1–10)
 *   valor  = TabelaArqueacao
 */
export type MatrizArqueacao = Record<number, TabelaArqueacao>

/**
 * Override individual salvo pelo Dev:
 *   tanqueId + alturaCm → novo volume fixo
 */
export interface ArqueacaoOverride {
  tanqueId: number
  alturaCm: number        // 1–255
  volumeLitros: number    // valor fixado pelo Dev
}

// ── Paleta de cores por combustível (tema claro) ──────────────────────────────

export const COR_COMBUSTIVEL: Record<TipoCombustivel, {
  // Tema claro (light)
  badge: string; grupo: string; barra: string; dot: string
  // Aliases para compatibilidade com componentes dark anteriores
  text: string; border: string; bg: string; bar: string
}> = {
  'Gasolina Comum':     { badge: 'bg-amber-50 text-amber-700 ring-amber-200',      grupo: 'border-amber-200 bg-amber-50/60',    barra: 'bg-amber-400',   dot: 'bg-amber-400',   text: 'text-yellow-400',  border: 'border-yellow-400/30',  bg: 'bg-yellow-400/5',  bar: 'bg-yellow-400' },
  'Gasolina Aditivada': { badge: 'bg-orange-50 text-orange-700 ring-orange-200',    grupo: 'border-orange-200 bg-orange-50/60',  barra: 'bg-orange-400',  dot: 'bg-orange-400',  text: 'text-orange-400',  border: 'border-orange-400/30',  bg: 'bg-orange-400/5',  bar: 'bg-orange-400' },
  'Etanol':             { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', grupo: 'border-emerald-200 bg-emerald-50/60',barra: 'bg-emerald-500', dot: 'bg-emerald-500', text: 'text-green-400',   border: 'border-green-400/30',   bg: 'bg-green-400/5',   bar: 'bg-green-400' },
  'Diesel S10':         { badge: 'bg-sky-50 text-sky-700 ring-sky-200',            grupo: 'border-sky-200 bg-sky-50/60',        barra: 'bg-sky-500',     dot: 'bg-sky-500',     text: 'text-blue-400',    border: 'border-blue-400/30',    bg: 'bg-blue-400/5',    bar: 'bg-blue-400' },
  'Diesel S500':        { badge: 'bg-violet-50 text-violet-700 ring-violet-200',    grupo: 'border-violet-200 bg-violet-50/60',  barra: 'bg-violet-500',  dot: 'bg-violet-500',  text: 'text-purple-400',  border: 'border-purple-400/30',  bg: 'bg-purple-400/5',  bar: 'bg-purple-400' },
}

/** Paleta neutra para combustíveis fora do mapa (ex.: label vindo do bridge). */
export const COR_NEUTRA = {
  badge: 'bg-brown-100 text-brown-600 ring-brown-200',
  grupo: 'border-brown-200 bg-brown-50/60',
  barra: 'bg-brown-400',
  dot: 'bg-brown-400',
  text: 'text-brown-500', border: 'border-brown-200', bg: 'bg-brown-50', bar: 'bg-brown-400',
}

/** Acessor seguro de cor por tipo/label de combustível (aceita string livre). */
export function corCombustivel(tipo: string) {
  return (COR_COMBUSTIVEL as Record<string, typeof COR_NEUTRA>)[tipo] ?? COR_NEUTRA
}
