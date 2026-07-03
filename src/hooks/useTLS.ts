import { useState, useEffect, useCallback, useRef } from 'react'
import { getLeiturasTLS, derivarAvisos } from '@/lib/tls/tlsService'
import type { LeituraTLS, AvisoTLS } from '@/lib/tls/tlsService'

interface EstadoTLS {
  leituras: LeituraTLS[]
  avisos: AvisoTLS[]
  carregando: boolean
  erro: string | null
  atualizadoEm: string | null
}

/**
 * Faz polling do console TLS-450 num intervalo fixo.
 * @param intervaloMs período de atualização (padrão 5s). 0 = sem polling.
 */
export function useTLS(intervaloMs = 5000) {
  const [estado, setEstado] = useState<EstadoTLS>({
    leituras: [], avisos: [], carregando: true, erro: null, atualizadoEm: null,
  })
  const montado = useRef(true)

  const atualizar = useCallback(async () => {
    try {
      const leituras = await getLeiturasTLS()
      if (!montado.current) return
      setEstado({
        leituras,
        avisos: derivarAvisos(leituras),
        carregando: false,
        erro: null,
        atualizadoEm: new Date().toISOString(),
      })
    } catch (e) {
      if (!montado.current) return
      setEstado(prev => ({ ...prev, carregando: false, erro: (e as Error).message }))
    }
  }, [])

  useEffect(() => {
    montado.current = true
    atualizar()
    if (intervaloMs <= 0) return () => { montado.current = false }
    const id = setInterval(atualizar, intervaloMs)
    return () => { montado.current = false; clearInterval(id) }
  }, [atualizar, intervaloMs])

  return { ...estado, atualizar }
}
