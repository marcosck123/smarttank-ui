import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth, DEV_TRIGGER_NAME, DEV_PASSWORD } from '@/context/AuthContext'

type Fase = 'nome' | 'senha_dev' | 'entrando'

export function LandingPage() {
  const { entrar } = useAuth()
  const [fase, setFase]           = useState<Fase>('nome')
  const [nome, setNome]           = useState('')
  const [senha, setSenha]         = useState('')
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [erroSenha, setErroSenha] = useState(false)
  const senhaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (fase === 'senha_dev') {
      const t = setTimeout(() => senhaRef.current?.focus(), 320)
      return () => clearTimeout(t)
    }
  }, [fase])

  function handleNome(e: React.FormEvent) {
    e.preventDefault()
    const n = nome.trim()
    if (n.length < 2) return
    if (n.toLowerCase().replace(/\s/g, '') === DEV_TRIGGER_NAME) {
      setFase('senha_dev')
    } else {
      setFase('entrando')
      setTimeout(() => entrar(n, 'OPERADOR'), 650)
    }
  }

  function handleSenha(e: React.FormEvent) {
    e.preventDefault()
    if (senha === DEV_PASSWORD) {
      setFase('entrando')
      setTimeout(() => entrar(nome.trim(), 'DESENVOLVEDOR'), 650)
    } else {
      setErroSenha(true)
      setSenha('')
      setTimeout(() => setErroSenha(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-brown-50 flex flex-col items-center justify-center px-4"
         style={{ background: 'linear-gradient(160deg, #fdf8f3 0%, #f5ede0 100%)' }}>

      <div className="pointer-events-none fixed inset-0 opacity-[0.018]"
           style={{
             backgroundImage: 'radial-gradient(circle, #6f4a2f 1px, transparent 1px)',
             backgroundSize: '28px 28px',
           }} />

      <div className="w-full max-w-[380px] relative z-10">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-9"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-brown-800 shadow-warm-md mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                 stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M3 5v14a9 3 0 0018 0V5"/>
              <path d="M3 12a9 3 0 0018 0"/>
            </svg>
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight text-brown-900">SmartTank</h1>
          <p className="text-[13px] text-brown-400 mt-1.5 tracking-wide">
            Sistema de Medição Noturna · Turno 00:00
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.07 }}
          className="bg-white rounded-2xl border border-brown-200 shadow-warm-md overflow-hidden"
        >
          <div className="h-[3px] w-full bg-brown-800" />

          <div className="p-7">
            <AnimatePresence mode="wait">

              {fase === 'nome' && (
                <motion.form key="nome"
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }} transition={{ duration: 0.18 }}
                  onSubmit={handleNome} className="space-y-5"
                >
                  <div>
                    <p className="text-sm font-semibold text-brown-900 mb-0.5">
                      Identificação do Operador
                    </p>
                    <p className="text-xs text-brown-400 mb-4">
                      Informe seu nome para registrar o turno.
                    </p>
                    <input
                      type="text" value={nome} onChange={e => setNome(e.target.value)}
                      placeholder="Nome completo" autoFocus
                      className="input-warm"
                    />
                  </div>
                  <button type="submit" disabled={nome.trim().length < 2} className="btn-primary w-full">
                    Entrar <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </motion.form>
              )}

              {fase === 'senha_dev' && (
                <motion.form key="senha"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
                  onSubmit={handleSenha} className="space-y-5"
                >
                  <div className="flex items-start gap-2.5 p-3 rounded-xl
                                  bg-brown-50 border border-brown-100">
                    <span className="text-sm mt-px">🔑</span>
                    <div>
                      <p className="text-xs font-semibold text-brown-800">Acesso restrito</p>
                      <p className="text-xs text-brown-400 mt-0.5">
                        Insira a senha de desenvolvedor para continuar.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brown-600 mb-1.5">
                      Senha do desenvolvedor
                    </label>
                    <div className="relative">
                      <input
                        ref={senhaRef}
                        type={senhaVisivel ? 'text' : 'password'}
                        value={senha}
                        onChange={e => { setSenha(e.target.value); setErroSenha(false) }}
                        placeholder="••••••••"
                        className={`input-warm pr-10 ${erroSenha
                          ? 'border-red-300 bg-red-50 focus:ring-red-100 focus:border-red-400'
                          : ''}`}
                      />
                      <button type="button" onClick={() => setSenhaVisivel(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2
                                   text-brown-300 hover:text-brown-600 transition-colors">
                        {senhaVisivel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {erroSenha && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.16 }}
                          className="mt-1.5 text-xs text-red-500">
                          Senha incorreta. Tente novamente.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => { setFase('nome'); setSenha('') }}
                      className="btn-secondary flex-1">
                      Voltar
                    </button>
                    <button type="submit" disabled={senha.length < 3}
                      className="btn-primary flex-1">
                      Acessar
                    </button>
                  </div>
                </motion.form>
              )}

              {fase === 'entrando' && (
                <motion.div key="entrando" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-8 gap-3">
                  <Loader2 className="w-6 h-6 text-brown-400 animate-spin" />
                  <p className="text-sm text-brown-400">Carregando painel…</p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-center text-xs text-brown-300 mt-7">
          SmartTank UI · v2.0
        </motion.p>
      </div>
    </div>
  )
}
