import { supabase } from './client'
import type { Medicao, LeiturasTanque } from '@/types'
import type { TipoCombustivel } from '@/config/tanquesConfig'

const LOCAL_KEY = 'smarttank:historico'

// ── LocalStorage fallback ─────────────────────────────────────────────────

function localCarregar(): Medicao[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') } catch { return [] }
}

function localSalvar(lista: Medicao[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(lista))
}

function localUpsert(medicao: Medicao) {
  const lista = localCarregar()
  const idx = lista.findIndex(m => m.id === medicao.id)
  const nova = idx >= 0 ? lista.map((m, i) => (i === idx ? medicao : m)) : [medicao, ...lista]
  localSalvar(nova)
}

// ── Helpers de serialização ───────────────────────────────────────────────

interface MedicaoRow { id: string; data_hora: string; operador: string; observacoes: string }
interface LeituraRow {
  medicao_id: string; tanque_id: number; nome: string; tipo: string
  comprimento_m: number; altura_cm: number; volume_litros: number; percentual: number
}

function medicaoParaRow(m: Medicao): MedicaoRow {
  return { id: m.id, data_hora: m.dataHora, operador: m.operador, observacoes: m.observacoes }
}

function leiturasParaRows(medicaoId: string, leituras: LeiturasTanque[]): LeituraRow[] {
  return leituras.map(l => ({
    medicao_id: medicaoId,
    tanque_id: l.tanqueId,
    nome: l.nome,
    tipo: l.tipo,
    comprimento_m: l.comprimentoM,
    altura_cm: parseFloat(l.alturaCm) || 0,
    volume_litros: l.volumeLitros,
    percentual: l.percentual,
  }))
}

function rowsParaMedicao(row: MedicaoRow, leituraRows: LeituraRow[]): Medicao {
  return {
    id: row.id,
    dataHora: row.data_hora,
    operador: row.operador,
    observacoes: row.observacoes,
    leituras: leituraRows.map(r => ({
      tanqueId: r.tanque_id,
      nome: r.nome,
      tipo: r.tipo as TipoCombustivel,
      comprimentoM: Number(r.comprimento_m),
      alturaCm: String(r.altura_cm),
      volumeLitros: Number(r.volume_litros),
      percentual: Number(r.percentual),
      valido: true,
    })),
  }
}

// ── API pública ───────────────────────────────────────────────────────────

export async function carregarHistorico(): Promise<Medicao[]> {
  if (!supabase) return localCarregar()

  const { data: medicoes, error: errM } = await supabase
    .from('medicoes')
    .select('id, data_hora, operador, observacoes')
    .order('data_hora', { ascending: false })

  if (errM || !medicoes) {
    console.error('[Supabase] carregarHistorico:', errM?.message)
    return localCarregar()
  }

  const ids = (medicoes as MedicaoRow[]).map(m => m.id)

  const { data: leituras, error: errL } = await supabase
    .from('leituras_tanque')
    .select('medicao_id, tanque_id, nome, tipo, comprimento_m, altura_cm, volume_litros, percentual')
    .in('medicao_id', ids)

  if (errL) {
    console.error('[Supabase] carregarLeituras:', errL.message)
    return localCarregar()
  }

  const leiturasRows = (leituras ?? []) as LeituraRow[]

  return (medicoes as MedicaoRow[]).map(m =>
    rowsParaMedicao(m, leiturasRows.filter(l => l.medicao_id === m.id))
  )
}

export async function salvarMedicao(medicao: Medicao): Promise<void> {
  localUpsert(medicao)
  if (!supabase) return

  const { error: errM } = await supabase
    .from('medicoes')
    .upsert(medicaoParaRow(medicao) as never, { onConflict: 'id' })

  if (errM) { console.error('[Supabase] salvarMedicao:', errM.message); return }

  await supabase.from('leituras_tanque').delete().eq('medicao_id', medicao.id)

  const { error: errL } = await supabase
    .from('leituras_tanque')
    .insert(leiturasParaRows(medicao.id, medicao.leituras) as never)

  if (errL) console.error('[Supabase] salvarLeituras:', errL.message)
}

export async function excluirMedicao(id: string): Promise<void> {
  localSalvar(localCarregar().filter(m => m.id !== id))
  if (!supabase) return

  const { error } = await supabase.from('medicoes').delete().eq('id', id)
  if (error) console.error('[Supabase] excluirMedicao:', error.message)
}
