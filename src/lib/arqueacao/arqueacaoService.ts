/**
 * Serviço de Arqueação — SmartTank
 *
 * Responsável por:
 *   1. Gerar a tabela padrão (fórmula cilíndrica) para cada tanque
 *   2. Carregar e mesclar overrides do Dev (Supabase ou localStorage)
 *   3. Expor consultas pontuais: getVolume(tanqueId, alturaCm)
 *   4. Persistir novos overrides quando o Dev editar um valor
 */

import { supabase } from '@/lib/supabase/client'
import { TANQUES, RAIO_M, ALTURA_MAX_CM } from '@/config/tanquesConfig'
import type { MatrizArqueacao, ArqueacaoOverride } from '@/config/tanquesConfig'

const LOCAL_KEY = 'smarttank:arqueacao_overrides'

// ─────────────────────────────────────────────────────────────────────────────
// FÓRMULA CILÍNDRICA HORIZONTAL (cálculo base)
// ─────────────────────────────────────────────────────────────────────────────

function calcBase(alturaCm: number, comprimentoM: number): number {
  if (alturaCm <= 0) return 0
  const R = RAIO_M
  const L = comprimentoM
  const h = alturaCm / 100
  const argAcos   = Math.max(-1, Math.min(1, (R - h) / R))
  const radicando = Math.max(0, 2 * R * h - Math.pow(h, 2))
  const v = L * 1000 * (Math.pow(R, 2) * Math.acos(argAcos) - (R - h) * Math.sqrt(radicando))
  return Math.round(v * 10) / 10
}

// ─────────────────────────────────────────────────────────────────────────────
// GERAÇÃO DA MATRIZ PADRÃO (255 linhas × 10 tanques)
// ─────────────────────────────────────────────────────────────────────────────

function gerarMatrizPadrao(): MatrizArqueacao {
  const matriz: MatrizArqueacao = {}
  for (const t of TANQUES) {
    const tabela: Record<number, number> = {}
    for (let cm = 1; cm <= ALTURA_MAX_CM; cm++) {
      tabela[cm] = calcBase(cm, t.comprimento)
    }
    matriz[t.id] = tabela
  }
  return matriz
}

// Singleton — gerado uma vez e mantido em memória
let _matrizPadrao: MatrizArqueacao | null = null
function getMatrizPadrao(): MatrizArqueacao {
  if (!_matrizPadrao) _matrizPadrao = gerarMatrizPadrao()
  return _matrizPadrao
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERRIDES — carregamento e mesclagem
// ─────────────────────────────────────────────────────────────────────────────

function localCarregarOverrides(): ArqueacaoOverride[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') }
  catch { return [] }
}

function localSalvarOverrides(overrides: ArqueacaoOverride[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(overrides))
}

/** Mescla overrides sobre a matriz padrão — retorna a matriz final */
function mesclarOverrides(overrides: ArqueacaoOverride[]): MatrizArqueacao {
  // Deep-clone para não mutar o singleton padrão
  const base = getMatrizPadrao()
  const matriz: MatrizArqueacao = {}
  for (const t of TANQUES) {
    matriz[t.id] = { ...base[t.id] }
  }
  for (const ov of overrides) {
    if (matriz[ov.tanqueId]) {
      matriz[ov.tanqueId][ov.alturaCm] = ov.volumeLitros
    }
  }
  return matriz
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO GLOBAL (singleton simples — sem Zustand/Redux)
// ─────────────────────────────────────────────────────────────────────────────

let _matrizAtiva: MatrizArqueacao = mesclarOverrides(localCarregarOverrides())
let _overridesAtivos: ArqueacaoOverride[] = localCarregarOverrides()

// ─────────────────────────────────────────────────────────────────────────────
// API PÚBLICA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Carrega overrides do Supabase (se disponível) e atualiza a matriz em memória.
 * Deve ser chamado uma vez ao iniciar o app.
 */
export async function inicializarArqueacao(): Promise<void> {
  if (!supabase) return  // fallback: só usa o localStorage

  const { data, error } = await supabase
    .from('arqueacao_overrides')
    .select('tanque_id, altura_cm, volume_litros')

  if (error || !data) {
    console.warn('[Arqueação] Usando overrides do localStorage:', error?.message)
    return
  }

  type Row = { tanque_id: number; altura_cm: number; volume_litros: number }
  const overrides: ArqueacaoOverride[] = (data as Row[]).map(r => ({
    tanqueId:     r.tanque_id,
    alturaCm:     r.altura_cm,
    volumeLitros: Number(r.volume_litros),
  }))

  // Sincroniza localStorage e memória com o que veio do Supabase
  localSalvarOverrides(overrides)
  _overridesAtivos = overrides
  _matrizAtiva = mesclarOverrides(overrides)
}

/**
 * Consulta pontual: dada uma altura (cm) e um tanqueId, retorna o volume
 * final (padrão ou override fixado pelo Dev).
 */
export function getVolume(tanqueId: number, alturaCm: number): number {
  const tabela = _matrizAtiva[tanqueId]
  if (!tabela) return 0
  const cm = Math.round(alturaCm)
  if (cm <= 0) return 0
  if (cm > ALTURA_MAX_CM) return tabela[ALTURA_MAX_CM] ?? 0
  return tabela[cm] ?? 0
}

/**
 * Retorna a tabela completa (255 linhas) de um tanque para exibição no modal.
 * Inclui flag `isOverride` para destacar visualmente os valores modificados.
 */
export function getTabelaTanque(tanqueId: number): { alturaCm: number; volumeLitros: number; isOverride: boolean }[] {
  const padrao = getMatrizPadrao()[tanqueId] ?? {}
  const ativa  = _matrizAtiva[tanqueId] ?? {}
  const overrideSet = new Set(_overridesAtivos.filter(o => o.tanqueId === tanqueId).map(o => o.alturaCm))

  return Array.from({ length: ALTURA_MAX_CM }, (_, i) => {
    const cm = i + 1
    return {
      alturaCm:     cm,
      volumeLitros: ativa[cm] ?? padrao[cm] ?? 0,
      isOverride:   overrideSet.has(cm),
    }
  })
}

/**
 * Persiste um override do Dev (um único par altura→volume).
 * Atualiza memória + localStorage + Supabase (se disponível).
 */
export async function salvarOverride(override: ArqueacaoOverride): Promise<void> {
  // Atualiza memória imediatamente (otimista)
  _matrizAtiva[override.tanqueId][override.alturaCm] = override.volumeLitros

  // Remove eventual override anterior para a mesma chave e adiciona o novo
  _overridesAtivos = [
    ..._overridesAtivos.filter(o => !(o.tanqueId === override.tanqueId && o.alturaCm === override.alturaCm)),
    override,
  ]
  localSalvarOverrides(_overridesAtivos)

  if (!supabase) return

  const { error } = await supabase
    .from('arqueacao_overrides')
    .upsert({
      tanque_id:     override.tanqueId,
      altura_cm:     override.alturaCm,
      volume_litros: override.volumeLitros,
    } as never, { onConflict: 'tanque_id,altura_cm' })

  if (error) console.error('[Arqueação] Erro ao salvar override:', error.message)
}

/**
 * Remove um override (restaura o valor padrão da fórmula).
 */
export async function removerOverride(tanqueId: number, alturaCm: number): Promise<void> {
  _matrizAtiva[tanqueId][alturaCm] = getMatrizPadrao()[tanqueId][alturaCm]
  _overridesAtivos = _overridesAtivos.filter(o => !(o.tanqueId === tanqueId && o.alturaCm === alturaCm))
  localSalvarOverrides(_overridesAtivos)

  if (!supabase) return

  await supabase
    .from('arqueacao_overrides')
    .delete()
    .eq('tanque_id', tanqueId)
    .eq('altura_cm', alturaCm)
}

/** Volume máximo teórico de um tanque (altura = 255 cm, sem override) */
export function getVolumeMax(tanqueId: number): number {
  return getMatrizPadrao()[tanqueId]?.[ALTURA_MAX_CM] ?? 0
}

/** Percentual de nível (0–100) baseado na tabela ativa */
export function getPercentual(tanqueId: number, alturaCm: number): number {
  const v    = getVolume(tanqueId, alturaCm)
  const vMax = getVolumeMax(tanqueId)
  return vMax > 0 ? Math.min(100, Math.round((v / vMax) * 1000) / 10) : 0
}
