/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_TLS_MODE?: 'mock' | 'http'
  readonly VITE_TLS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
