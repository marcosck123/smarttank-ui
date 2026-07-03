/**
 * Detecção de descargas (recebimento de combustível) a partir das leituras do TLS.
 *
 * Regra: quando o volume de um tanque SOBE além de um limiar entre duas
 * leituras consecutivas, interpretamos como uma descarga e registramos
 * qual tanque, combustível, quanto entrou (arredondado) e quando.
 *
 * Persistência offline-first (Supabase + localStorage). O detector é chamado
 * a cada snapshot de leituras; com o agente TLS real rodando, as descargas
 * passam a ser detectadas continuamente.
 */

import { supabase } from '@/lib/supabase/client'
import type { LeituraTLS } from './tlsService'
import type { TipoCombustivel } from '@/config/tanquesConfig'

/** Aumento mínimo de volume (L) para considerar uma descarga. */
const LIMIAR_DESCARGA_L = 2000

const K_DESCARGAS = 'smarttank:descargas'
const K_ULTIMO_VOL = 'smarttank:tls_ultimo_volume'

export interface Descarga {
  id: string
  tanqueId: number
  nome: string
  tipo: TipoCombustivel
  volumeAntes: number
  volumeDepois: number
  quantidade: number     // arredondada para 100 L
  dataHora: string       // ISO
}

// ── LocalStorage ────────────────────────────────────────────────────────────

function lerDescargas(): Descarga[] {
  try { return JSON.parse(localStorage.getItem(K_DESCARGAS) ?? '[]') } catch { return [] }
}
function gravarDescargas(l: Descarga[]) {
  localStorage.setItem(K_DESCARGAS, JSON.stringify(l.slice(0, 500)))
}
function lerUltimoVolume(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(K_ULTIMO_VOL) ?? '{}') } catch { return {} }
}
function gravarUltimoVolume(m: Record<number, number>) {
  localStorage.setItem(K_ULTIMO_VOL, JSON.stringify(m))
}

function novoId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` }
function arredondar100(v: number) { return Math.round(v / 100) * 100 }

// ── Serialização Supabase ─────────────────────────────────────────────────

interface DescargaRow {
  id: string; tanque_id: number; nome: string; tipo: string
  volume_antes: number; volume_depois: number; quantidade: number; data_hora: string
}
function descargaParaRow(d: Descarga): DescargaRow {
  return {
    id: d.id, tanque_id: d.tanqueId, nome: d.nome, tipo: d.tipo,
    volume_antes: d.volumeAntes, volume_depois: d.volumeDepois,
    quantidade: d.quantidade, data_hora: d.dataHora,
  }
}
function rowParaDescarga(r: DescargaRow): Descarga {
  return {
    id: r.id, tanqueId: r.tanque_id, nome: r.nome, tipo: r.tipo as TipoCombustivel,
    volumeAntes: Number(r.volume_antes), volumeDepois: Number(r.volume_depois),
    quantidade: Number(r.quantidade), dataHora: r.data_hora,
  }
}

async function persistir(d: Descarga) {
  const lista = [d, ...lerDescargas()]
  gravarDescargas(lista)
  if (supabase) {
    const { error } = await supabase.from('descargas').insert(descargaParaRow(d) as never)
    if (error) console.error('[Supabase] insert descarga:', error.message)
  }
}

// ── API pública ─────────────────────────────────────────────────────────────

export async function carregarDescargas(): Promise<Descarga[]> {
  if (!supabase) return lerDescargas()
  const { data, error } = await supabase
    .from('descargas')
    .select('id, tanque_id, nome, tipo, volume_antes, volume_depois, quantidade, data_hora')
    .order('data_hora', { ascending: false })
    .limit(300)
  if (error || !data) { console.error('[Supabase] carregarDescargas:', error?.message); return lerDescargas() }
  const lista = (data as DescargaRow[]).map(rowParaDescarga)
  gravarDescargas(lista)
  return lista
}

/**
 * Compara as leituras atuais com o último volume conhecido de cada tanque.
 * Registra descargas para os aumentos acima do limiar. Retorna as novas.
 */
export async function registrarSnapshot(leituras: LeituraTLS[]): Promise<Descarga[]> {
  const ultimos = lerUltimoVolume()
  const novas: Descarga[] = []

  for (const l of leituras) {
    const antes = ultimos[l.tanqueId]
    if (antes !== undefined && l.volumeLitros - antes >= LIMIAR_DESCARGA_L) {
      const d: Descarga = {
        id: novoId(),
        tanqueId: l.tanqueId, nome: l.nome, tipo: l.tipo,
        volumeAntes: Math.round(antes),
        volumeDepois: Math.round(l.volumeLitros),
        quantidade: arredondar100(l.volumeLitros - antes),
        dataHora: new Date().toISOString(),
      }
      novas.push(d)
      await persistir(d)
    }
    ultimos[l.tanqueId] = l.volumeLitros
  }

  gravarUltimoVolume(ultimos)
  return novas
}

/**
 * Simula uma descarga para demonstração (enquanto o TLS real não está ligado).
 * Cria um recebimento plausível no tanque informado.
 */
export async function simularDescarga(leitura: LeituraTLS): Promise<Descarga> {
  const quantidade = arredondar100(5000 + Math.random() * 8000)
  const d: Descarga = {
    id: novoId(),
    tanqueId: leitura.tanqueId, nome: leitura.nome, tipo: leitura.tipo,
    volumeAntes: Math.round(leitura.volumeLitros),
    volumeDepois: Math.round(leitura.volumeLitros + quantidade),
    quantidade,
    dataHora: new Date().toISOString(),
  }
  await persistir(d)
  return d
}
