import { useState, useCallback, useMemo } from 'react'
import { TANQUES } from '@/config/tanquesConfig'
import { getVolume, getVolumeMax } from '@/lib/arqueacao/arqueacaoService'
import type { LeiturasTanque } from '@/types'

/**
 * Wizard de Nota de Aferição — preenchimento passo-a-passo, tanque a tanque.
 *
 * Diferença para o useLancamento: aqui o volume vem da TABELA DE ARQUEAÇÃO
 * (lookup fixo altura→volume), não da fórmula. É o valor oficial que vai para
 * a planilha de aferição. A altura é digitada manualmente pelo operador.
 */

function leituraInicial(): LeiturasTanque[] {
  return TANQUES.map(t => ({
    tanqueId: t.id,
    nome: t.nome,
    tipo: t.tipo,
    comprimentoM: t.comprimento,
    alturaCm: '',
    volumeLitros: 0,
    percentual: 0,
    valido: false,
  }))
}

export function useNotaWizard() {
  const [leituras, setLeituras] = useState<LeiturasTanque[]>(leituraInicial)
  const [observacoes, setObservacoes] = useState('')
  const [passo, setPasso] = useState(0)   // índice 0..9 (tanque atual)

  const total = TANQUES.length
  const leituraAtual = leituras[passo]
  const primeiro = passo === 0
  const ultimo = passo === total - 1

  const atualizarAltura = useCallback((tanqueId: number, valor: string) => {
    setLeituras(prev =>
      prev.map(l => {
        if (l.tanqueId !== tanqueId) return l
        if (valor === '') {
          return { ...l, alturaCm: '', volumeLitros: 0, percentual: 0, valido: false, erro: undefined }
        }
        const altura = parseFloat(valor.replace(',', '.'))
        if (isNaN(altura) || altura < 0) {
          return { ...l, alturaCm: valor, volumeLitros: 0, percentual: 0, valido: false, erro: 'Altura inválida' }
        }
        const volume = getVolume(l.tanqueId, altura)
        const vMax = getVolumeMax(l.tanqueId)
        const percentual = vMax > 0 ? Math.min(100, (volume / vMax) * 100) : 0
        return {
          ...l,
          alturaCm: valor,
          volumeLitros: volume,
          percentual,
          valido: volume > 0,
          erro: volume > 0 ? undefined : 'Sem volume mapeado para esta altura',
        }
      })
    )
  }, [])

  // Permite editar o volume diretamente (caso o operador queira sobrepor o lookup nessa nota)
  const definirVolume = useCallback((tanqueId: number, volume: number) => {
    setLeituras(prev =>
      prev.map(l => {
        if (l.tanqueId !== tanqueId) return l
        const vMax = getVolumeMax(l.tanqueId)
        const percentual = vMax > 0 ? Math.min(100, (volume / vMax) * 100) : 0
        return { ...l, volumeLitros: volume, percentual, valido: volume > 0, erro: undefined }
      })
    )
  }, [])

  const avancar = useCallback(() => setPasso(p => Math.min(total - 1, p + 1)), [total])
  const voltar  = useCallback(() => setPasso(p => Math.max(0, p - 1)), [])
  const irPara  = useCallback((i: number) => setPasso(Math.max(0, Math.min(total - 1, i))), [total])

  const resetar = useCallback(() => {
    setLeituras(leituraInicial())
    setObservacoes('')
    setPasso(0)
  }, [])

  const carregar = useCallback((base: LeiturasTanque[], obs: string) => {
    setLeituras(base.map(l => ({ ...l })))
    setObservacoes(obs)
    setPasso(0)
  }, [])

  const preenchidos = useMemo(() => leituras.filter(l => l.valido).length, [leituras])
  const todasPreenchidas = preenchidos === total
  const totalLitros = useMemo(
    () => leituras.reduce((acc, l) => acc + (l.valido ? l.volumeLitros : 0), 0),
    [leituras]
  )

  return {
    leituras, leituraAtual, observacoes, setObservacoes,
    passo, total, primeiro, ultimo,
    atualizarAltura, definirVolume,
    avancar, voltar, irPara, resetar, carregar,
    preenchidos, todasPreenchidas, totalLitros,
  }
}
