import { useState, useCallback, useEffect } from 'react'
import type { Medicao } from '@/types'
import {
  carregarHistorico,
  salvarMedicao as dbSalvar,
  excluirMedicao as dbExcluir,
} from '@/lib/supabase/medicaoService'
import { isOnline } from '@/lib/supabase/client'

const OPERADOR_KEY = 'smarttank:operador'

export type Aba = 'lancamento' | 'historico'
export type StatusSync = 'idle' | 'carregando' | 'salvando' | 'erro'

export function useAppStore() {
  const [operador, setOperadorState] = useState<string>(
    () => localStorage.getItem(OPERADOR_KEY) ?? ''
  )
  const [abaAtiva, setAbaAtiva] = useState<Aba>('lancamento')
  const [historico, setHistorico] = useState<Medicao[]>([])
  const [statusSync, setStatusSync] = useState<StatusSync>('idle')
  const modoOffline = !isOnline()

  // Carrega histórico ao montar (Supabase ou localStorage)
  useEffect(() => {
    setStatusSync('carregando')
    carregarHistorico()
      .then(setHistorico)
      .catch(() => setStatusSync('erro'))
      .finally(() => setStatusSync('idle'))
  }, [])

  const salvarOperador = useCallback((nome: string) => {
    localStorage.setItem(OPERADOR_KEY, nome)
    setOperadorState(nome)
  }, [])

  const salvarMedicao = useCallback(async (medicao: Medicao) => {
    setStatusSync('salvando')
    try {
      await dbSalvar(medicao)
      setHistorico(prev => {
        const idx = prev.findIndex(m => m.id === medicao.id)
        return idx >= 0
          ? prev.map((m, i) => (i === idx ? medicao : m))
          : [medicao, ...prev]
      })
    } catch {
      setStatusSync('erro')
    } finally {
      setStatusSync('idle')
    }
  }, [])

  const excluirMedicao = useCallback(async (id: string) => {
    setStatusSync('salvando')
    try {
      await dbExcluir(id)
      setHistorico(prev => prev.filter(m => m.id !== id))
    } catch {
      setStatusSync('erro')
    } finally {
      setStatusSync('idle')
    }
  }, [])

  const recarregarHistorico = useCallback(() => {
    setStatusSync('carregando')
    return carregarHistorico()
      .then(setHistorico)
      .catch(() => setStatusSync('erro'))
      .finally(() => setStatusSync('idle'))
  }, [])

  return {
    operador,
    salvarOperador,
    abaAtiva,
    setAbaAtiva,
    historico,
    statusSync,
    modoOffline,
    salvarMedicao,
    excluirMedicao,
    recarregarHistorico,
  }
}
