import { useState, useCallback } from 'react'
import type { Medicao } from '@/types'

const STORAGE_KEY = 'smarttank:historico'
const OPERADOR_KEY = 'smarttank:operador'

function carregarHistorico(): Medicao[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export type Aba = 'lancamento' | 'historico'

export function useAppStore() {
  const [operador, setOperadorState] = useState<string>(
    () => localStorage.getItem(OPERADOR_KEY) ?? ''
  )
  const [abaAtiva, setAbaAtiva] = useState<Aba>('lancamento')
  const [historico, setHistorico] = useState<Medicao[]>(carregarHistorico)

  const salvarOperador = useCallback((nome: string) => {
    localStorage.setItem(OPERADOR_KEY, nome)
    setOperadorState(nome)
  }, [])

  const salvarMedicao = useCallback((medicao: Medicao) => {
    setHistorico(prev => {
      const existeIndex = prev.findIndex(m => m.id === medicao.id)
      const nova = existeIndex >= 0
        ? prev.map((m, i) => (i === existeIndex ? medicao : m))
        : [medicao, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nova))
      return nova
    })
  }, [])

  const excluirMedicao = useCallback((id: string) => {
    setHistorico(prev => {
      const nova = prev.filter(m => m.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nova))
      return nova
    })
  }, [])

  return {
    operador,
    salvarOperador,
    abaAtiva,
    setAbaAtiva,
    historico,
    salvarMedicao,
    excluirMedicao,
  }
}
