import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  console.warn('[SmartTank] Supabase não configurado — usando modo offline (localStorage).')
}

export const supabase = url && key ? createClient<Database>(url, key) : null

export const isOnline = () => Boolean(supabase)
