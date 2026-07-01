import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth, DEV_TRIGGER_NAME, DEV_PASSWORD } from '@/context/AuthContext'

type Fase = 'nome' | 'senha_dev' | 'entrando'

export function LandingPage() {
  const { entrar }  = useAuth()
  const [fase, setFase]           = useState<Fase>('nome')
  const [nome, setNome]           = useState('')
  const [senha, setSenha]         = useState('')
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [erroSenha, setErroSenha] = useState(false)
  const senhaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (fase === 'senha_dev') {
      const t = setTimeout(() => senhaRef.current?.focus(), 350)
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
      setTimeout(() => entrar(n, 'OPERADOR'), 700)
    }
  }

  function handleSenha(e: React.FormEvent) {
    e.preventDefault()
    if (senha === DEV_PASSWORD) {
      setFase('entrando')
      setTimeout(() => entrar(nome.trim(), 'DESENVOLVEDOR'), 700)
    } else {
      setErroSenha(true)
      setSenha('')
      setTimeout(() => setErroSenha(false), 2200)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">

      {/* Marca d'água de grade sutil */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(#94a3b8 1px,transparent 1px),linear-gradient(90deg,#94a3b8 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-[400px] relative">

        {/* ── Cabeçalho / Produto ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          {/* Ícone minimalista */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl
                          bg-slate-900 mb-5 shadow-sm">
            {/* Ícone de tanque estilizado em SVG inline */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M3 5v14a9 3 0 0018 0V5"/>
              <path d="M3 12a9 3 0 0018 0"/>
            </svg>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            SmartTank
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 tracking-wide">
            Sistema de Medição de Tanques Subterrâneos
          </p>
        </motion.div>

        {/* ── Card de Identificação ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
        >
          {/* Linha superior decorativa */}
          <div className="h-[2px] w-full bg-slate-900" />

          <div className="p-7">
            <AnimatePresence mode="wait">

              {/* FASE: Nome */}
              {fase === 'nome' && (
                <motion.form
                  key="nome"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleNome}
                  className="space-y-5"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 mb-1">
                      Identificação
                    </p>
                    <p className="text-xs text-slate-400 mb-4">
                      Informe seu nome para iniciar o registro do turno.
                    </p>
                    <input
                      type="text"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      placeholder="Nome do operador"
                      autoFocus
                      className="w-full rounded-lg border border-slate-200 bg-slate-50
                                 px-3.5 py-2.5 text-sm text-slate-900
                                 placeholder:text-slate-400
                                 outline-none transition-all
                                 focus:border-slate-400 focus:bg-white focus:ring-3 focus:ring-slate-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={nome.trim().length < 2}
                    className="w-full flex items-center justify-center gap-2
                               py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium
                               hover:bg-slate-800 active:bg-slate-950
                               disabled:opacity-35 disabled:cursor-not-allowed
                               transition-colors duration-150"
                  >
                    Entrar
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </motion.form>
              )}

              {/* FASE: Senha Dev — campo oculto que aparece com animação suave */}
              {fase === 'senha_dev' && (
                <motion.form
                  key="senha"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSenha}
                  className="space-y-5"
                >
                  {/* Aviso discreto */}
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 mt-px text-xs leading-none">🔑</span>
                    <div>
                      <p className="text-xs font-medium text-slate-700">Acesso restrito</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Insira a senha de desenvolvedor para continuar.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Senha do desenvolvedor
                    </label>
                    <div className="relative">
                      <input
                        ref={senhaRef}
                        type={senhaVisivel ? 'text' : 'password'}
                        value={senha}
                        onChange={e => { setSenha(e.target.value); setErroSenha(false) }}
                        placeholder="••••••••••"
                        className={`w-full rounded-lg border bg-slate-50 pr-10
                                   px-3.5 py-2.5 text-sm text-slate-900
                                   outline-none transition-all
                                   ${erroSenha
                                     ? 'border-red-300 bg-red-50 focus:ring-3 focus:ring-red-100'
                                     : 'border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-3 focus:ring-slate-100'
                                   }`}
                      />
                      <button
                        type="button"
                        onClick={() => setSenhaVisivel(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2
                                   text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {senhaVisivel
                          ? <EyeOff className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <AnimatePresence>
                      {erroSenha && (
                        <motion.p
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18 }}
                          className="mt-1.5 text-xs text-red-500"
                        >
                          Senha incorreta. Tente novamente.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => { setFase('nome'); setSenha('') }}
                      className="flex-1 py-2.5 rounded-lg border border-slate-200
                                 text-sm text-slate-600 hover:bg-slate-50
                                 transition-colors duration-150"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={senha.length < 3}
                      className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium
                                 hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed
                                 transition-colors duration-150"
                    >
                      Acessar
                    </button>
                  </div>
                </motion.form>
              )}

              {/* FASE: Entrando */}
              {fase === 'entrando' && (
                <motion.div
                  key="entrando"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-8 gap-3"
                >
                  <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  <p className="text-sm text-slate-400">Carregando painel…</p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>

        {/* Rodapé discreto */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-slate-300 mt-8 tracking-wide"
        >
          SmartTank UI · Turno 00:00
        </motion.p>

      </div>
    </div>
  )
}
