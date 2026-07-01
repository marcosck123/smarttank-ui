import { useState, useCallback } from 'react'
import { TANQUES } from '@/config/tanquesConfig'
import { calcularVolume } from '@/lib/calcVolume'
import type { LeiturasTanque } from '@/types'

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

export function useLancamento() {
  const [leituras, setLeituras] = useState<LeiturasTanque[]>(leituraInicial)
  const [observacoes, setObservacoes] = useState('')

  const atualizarAltura = useCallback((tanqueId: number, valor: string) => {
    setLeituras(prev =>
      prev.map(l => {
        if (l.tanqueId !== tanqueId) return l
        if (valor === '') {
          return { ...l, alturaCm: '', volumeLitros: 0, percentual: 0, valido: false, erro: undefined }
        }
        const altura = parseFloat(valor.replace(',', '.'))
        if (isNaN(altura)) {
          return { ...l, alturaCm: valor, volumeLitros: 0, percentual: 0, valido: false, erro: 'Valor inválido' }
        }
        const resultado = calcularVolume(altura, l.comprimentoM)
        return {
          ...l,
          alturaCm: valor,
          volumeLitros: resultado.volumeLitros,
          percentual: resultado.percentual,
          valido: resultado.valido,
          erro: resultado.erro,
        }
      })
    )
  }, [])

  const resetar = useCallback(() => {
    setLeituras(leituraInicial())
    setObservacoes('')
  }, [])

  const todasPreenchidas = leituras.every(l => l.alturaCm !== '' && l.valido)

  return { leituras, observacoes, setObservacoes, atualizarAltura, resetar, todasPreenchidas }
}
