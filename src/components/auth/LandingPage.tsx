import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Fuel, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, Zap } from 'lucide-react'
import { useAuth, DEV_TRIGGER_NAME, DEV_PASSWORD } from '@/context/AuthContext'

type Fase = 'nome' | 'senha_dev' | 'carregando'

export function LandingPage() {
  const { entrar } = useAuth()
  const [fase, setFase]           = useState<Fase>('nome')
  const [nome, setNome]           = useState('')
  const [senha, setSenha]         = useState('')
  const [erroSenha, setErroSenha] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const senhaRef = useRef<HTMLInputElement>(null)

  // Foca automaticamente no campo de senha ao aparecer
  useEffect(() => {
    if (fase === 'senha_dev') {
      setTimeout(() => senhaRef.current?.focus(), 400)
    }
  }, [fase])

  function handleNomeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const normalizado = nome.trim().toLowerCase().replace(/\s/g, '')
    if (normalizado === DEV_TRIGGER_NAME) {
      setFase('senha_dev')
    } else if (nome.trim().length >= 2) {
      setFase('carregando')
      setTimeout(() => entrar(nome.trim(), 'OPERADOR'), 800)
    }
  }

  function handleSenhaSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroSenha(false)
    if (senha === DEV_PASSWORD) {
      setFase('carregando')
      setTimeout(() => entrar(nome.trim(), 'DESENVOLVEDOR'), 900)
    } else {
      setErroSenha(true)
      setSenha('')
      setTimeout(() => setErroSenha(false), 2500)
    }
  }

  function voltarParaNome() {
    setFase('nome')
    setSenha('')
    setErroSenha(false)
  }

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden p-4">

      {/* ── Grade decorativa de fundo ──────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Glows de luz neon ─────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full
                        bg-green-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full
                        bg-emerald-600/8 blur-[100px]" />
        <div className="absolute top-1/3 -left-20 w-[300px] h-[300px] rounded-full
                        bg-teal-500/6 blur-[80px]" />
      </div>

      {/* ── Partículas flutuantes decorativas ────────────────────────────── */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute w-1 h-1 rounded-full bg-green-400/40"
          style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}

      {/* ── Card principal ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Borda neon animada */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-green-500/30 via-transparent to-emerald-500/20 blur-sm" />

        <div className="relative rounded-2xl bg-slate-900/90 border border-slate-700/60 backdrop-blur-xl shadow-2xl overflow-hidden">

          {/* Linha decorativa no topo */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
              >
                {/* Brilho do ícone */}
                <div className="absolute inset-0 rounded-2xl bg-green-500/20 blur-md" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700
                                flex items-center justify-center shadow-lg shadow-green-900/50">
                  <Fuel className="w-9 h-9 text-white" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-center"
              >
                <h1 className="text-3xl font-black tracking-tight text-white">
                  Smart<span className="text-green-400">Tank</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1 tracking-wide">
                  Sistema de Medição Noturna · v2.0
                </p>
              </motion.div>
            </div>

            {/* ── Formulários com AnimatePresence ─────────────────────────── */}
            <AnimatePresence mode="wait">

              {/* FASE: Nome */}
              {fase === 'nome' && (
                <motion.form
                  key="form-nome"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleNomeSubmit}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                      Identificação do Operador
                    </label>
                    <input
                      type="text"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      placeholder="Digite seu nome completo…"
                      autoFocus
                      className="w-full rounded-xl bg-slate-800/80 border border-slate-600/60 px-4 py-3.5
                                 text-white placeholder-slate-500 text-sm outline-none
                                 focus:border-green-500/70 focus:ring-2 focus:ring-green-500/20
                                 transition-all duration-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={nome.trim().length < 2}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                               bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm
                               hover:from-green-500 hover:to-emerald-500
                               disabled:opacity-40 disabled:cursor-not-allowed
                               shadow-lg shadow-green-900/30 transition-all duration-200
                               focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Entrar no Sistema
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.form>
              )}

              {/* FASE: Senha Dev (Easter Egg) */}
              {fase === 'senha_dev' && (
                <motion.form
                  key="form-senha"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  onSubmit={handleSenhaSubmit}
                  className="space-y-5"
                >
                  {/* Badge dev */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg
                               bg-amber-500/10 border border-amber-500/30"
                  >
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-300 font-medium">
                      Modo Desenvolvedor detectado — autenticação adicional requerida
                    </span>
                  </motion.div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                      Senha do Desenvolvedor
                    </label>
                    <div className="relative">
                      <input
                        ref={senhaRef}
                        type={mostrarSenha ? 'text' : 'password'}
                        value={senha}
                        onChange={e => { setSenha(e.target.value); setErroSenha(false) }}
                        placeholder="••••••••"
                        className={`w-full rounded-xl bg-slate-800/80 border px-4 py-3.5 pr-12
                                   text-white placeholder-slate-500 text-sm outline-none
                                   focus:ring-2 transition-all duration-200
                                   ${erroSenha
                                     ? 'border-red-500/70 focus:ring-red-500/20 animate-shake'
                                     : 'border-slate-600/60 focus:border-amber-500/70 focus:ring-amber-500/20'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {erroSenha && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-2 text-xs text-red-400"
                        >
                          Senha incorreta. Tente novamente.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={voltarParaNome}
                      className="flex-1 py-3 rounded-xl border border-slate-600/60 text-slate-400 text-sm
                                 hover:border-slate-500 hover:text-slate-300 transition-all duration-200"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={senha.length < 3}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                                 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-sm
                                 hover:from-amber-500 hover:to-orange-500
                                 disabled:opacity-40 disabled:cursor-not-allowed
                                 shadow-lg shadow-amber-900/30 transition-all duration-200"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Acessar
                    </button>
                  </div>
                </motion.form>
              )}

              {/* FASE: Carregando */}
              {fase === 'carregando' && (
                <motion.div
                  key="carregando"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8 gap-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <p className="text-slate-400 text-sm">Carregando painel…</p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Rodapé do card */}
          <div className="px-8 py-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-600">Turno Noturno · 00:00</span>
            <span className="text-xs text-slate-700 font-mono">SmartTank UI v2.0</span>
          </div>
        </div>
      </motion.div>

    </div>
  )
}
