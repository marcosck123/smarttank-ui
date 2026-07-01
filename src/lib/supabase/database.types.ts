export interface Database {
  public: {
    Tables: {
      medicoes: {
        Row: {
          id: string
          data_hora: string
          operador: string
          observacoes: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['medicoes']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['medicoes']['Insert']>
      }
      leituras_tanque: {
        Row: {
          id: number
          medicao_id: string
          tanque_id: number
          nome: string
          tipo: string
          comprimento_m: number
          altura_cm: number
          volume_litros: number
          percentual: number
        }
        Insert: Omit<Database['public']['Tables']['leituras_tanque']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['leituras_tanque']['Insert']>
      }
    }
  }
}
