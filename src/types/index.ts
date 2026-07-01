import type { TipoCombustivel } from '@/config/tanquesConfig'

export interface LeiturasTanque {
  tanqueId: number
  nome: string
  tipo: TipoCombustivel
  comprimentoM: number
  alturaCm: string       // string para controlar input vazio
  volumeLitros: number
  percentual: number
  valido: boolean
  erro?: string
}

export interface Medicao {
  id: string             // uuid gerado no cliente
  dataHora: string       // ISO string
  operador: string
  leituras: LeiturasTanque[]
  observacoes: string
}
