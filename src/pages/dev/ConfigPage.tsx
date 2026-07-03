import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Users, History, Shield, Zap, Trash2, X,
  RefreshCw, Loader2, Inbox, LogIn, FileCheck,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Perfil } from '@/context/AuthContext'
import { CATALOGO_PERMISSOES } from '@/types/config'
import type { UsuarioRegistro, AcessoLog, Permissao } from '@/types/config'
import {
  carregarUsuarios, carregarAcessos,
  atualizarPermissoes, atualizarPerfil, excluirUsuario,
} from '@/lib/supabase/usuariosService'

type Sub = 'usuarios' | 'acessos'

export function ConfigPage() {
  const [sub, setSub] = useState<Sub>('usuarios')
  const [usuarios, setUsuarios] = useState<UsuarioRegistro[]>([])
  const [acessos, setAcessos]   = useState<AcessoLog[]>([])
  const [carregando, setCarregando] = useState(true)
  const [selecionado, setSelecionado] = useState<UsuarioRegistro | null>(null)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    const [us, ac] = await Promise.all([carregarUsuarios(), carregarAcessos()])
    setUsuarios(us); setAcessos(ac)
    setCarregando(false)
  }, [])

  useEffect(() => { recarregar() }, [recarregar])

  async function salvarPermissoes(id: string, permissoes: Permissao[]) {
    await atualizarPermissoes(id, permissoes)
    setUsuarios(prev => prev.map(u => (u.id === id ? { ...u, permissoes } : u)))
    setSelecionado(prev => (prev && prev.id === id ? { ...prev, permissoes } : prev))
  }

  async function trocarPerfil(id: string, perfil: Perfil) {
    await atualizarPerfil(id, perfil)
    await recarregar()
    setSelecionado(null)
  }

  async function remover(id: string) {
    await excluirUsuario(id)
    setUsuarios(prev => prev.filter(u => u.id !== id))
    setSelecionado(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-brown-600" />
        <h2 className="text-lg font-semibold text-brown-900">Configurações</h2>
        <span className="text-xs bg-amber-50 border border-amber-200 text-amber-600 rounded-full px-2 py-0.5 ml-1">
          DEV
        </span>
      </div>

      {/* Abas internas */}
      <div className="flex items-center gap-1 border-b border-brown-200">
        <TabBtn ativo={sub === 'usuarios'} onClick={() => setSub('usuarios')} icon={<Users className="w-4 h-4" />}>
          Usuários
        </TabBtn>
        <TabBtn ativo={sub === 'acessos'} onClick={() => setSub('acessos')} icon={<History className="w-4 h-4" />}>
          Histórico de Acessos
        </TabBtn>
        <button
          onClick={recarregar}
          disabled={carregando}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 mb-1 rounded-lg text-xs text-brown-400
                     hover:text-brown-800 hover:bg-brown-100 disabled:opacity-50 transition-colors"
        >
          {carregando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Atualizar
        </button>
      </div>

      {carregando ? (
        <div className="flex flex-col items-center justify-center py-24 text-brown-300">
          <Loader2 className="w-10 h-10 mb-4 animate-spin" />
          <p className="text-sm">Carregando…</p>
        </div>
      ) : sub === 'usuarios' ? (
        <ListaUsuarios usuarios={usuarios} onGerir={setSelecionado} />
      ) : (
        <ListaAcessos acessos={acessos} />
      )}

      <AnimatePresence>
        {selecionado && (
          <ModalPermissoes
            usuario={selecionado}
            onFechar={() => setSelecionado(null)}
            onSalvarPermissoes={salvarPermissoes}
            onTrocarPerfil={trocarPerfil}
            onRemover={remover}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────

function TabBtn({ ativo, onClick, icon, children }: {
  ativo: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
        ${ativo
          ? 'border-brown-800 text-brown-900'
          : 'border-transparent text-brown-400 hover:text-brown-700'}`}
    >
      {icon}{children}
    </button>
  )
}

function ListaUsuarios({ usuarios, onGerir }: {
  usuarios: UsuarioRegistro[]; onGerir: (u: UsuarioRegistro) => void
}) {
  if (usuarios.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-brown-300">
      <Inbox className="w-12 h-12 mb-4" />
      <p className="text-lg font-medium">Nenhum usuário registrado</p>
      <p className="text-sm mt-1">Os operadores aparecem aqui após o primeiro login.</p>
    </div>
  )

  return (
    <div className="overflow-x-auto rounded-xl border border-brown-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brown-200 bg-brown-50">
            {['Nome', 'Perfil', 'Notas', 'Último acesso', 'Permissões', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brown-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u, i) => (
            <tr key={u.id} className={`border-b border-brown-100 ${i % 2 === 0 ? 'bg-white' : 'bg-brown-50/40'}`}>
              <td className="px-4 py-3 font-semibold text-brown-900">{u.nome}</td>
              <td className="px-4 py-3">
                {u.perfil === 'DESENVOLVEDOR'
                  ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"><Zap className="w-3 h-3" />DEV</span>
                  : <span className="text-[11px] text-brown-500 bg-brown-100 border border-brown-200 rounded-full px-2 py-0.5">OPERADOR</span>}
              </td>
              <td className="px-4 py-3 font-mono text-brown-700">{u.totalNotas}</td>
              <td className="px-4 py-3 font-mono text-xs text-brown-500">
                {format(new Date(u.ultimoAcesso), 'dd/MM/yy HH:mm', { locale: ptBR })}
              </td>
              <td className="px-4 py-3 text-xs text-brown-500">{u.permissoes.length} ativa{u.permissoes.length !== 1 ? 's' : ''}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onGerir(u)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                             border border-brown-200 text-brown-600 hover:bg-brown-50 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" /> Gerir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ListaAcessos({ acessos }: { acessos: AcessoLog[] }) {
  if (acessos.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-brown-300">
      <History className="w-12 h-12 mb-4" />
      <p className="text-lg font-medium">Sem acessos registrados</p>
    </div>
  )

  return (
    <div className="overflow-hidden rounded-xl border border-brown-200 divide-y divide-brown-100">
      {acessos.map(a => (
        <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-brown-50/60 transition-colors">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
            ${a.acao === 'emissao_nota' ? 'bg-brown-100 text-brown-700' : 'bg-brown-50 text-brown-400'}`}>
            {a.acao === 'emissao_nota' ? <FileCheck className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
          </div>
          <span className="text-sm font-medium text-brown-900">{a.nome}</span>
          <span className="text-xs text-brown-400">
            {a.acao === 'emissao_nota' ? 'emitiu uma nota' : 'entrou no sistema'}
          </span>
          <span className="ml-auto text-xs font-mono text-brown-400">
            {format(new Date(a.dataHora), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
      ))}
    </div>
  )
}

function ModalPermissoes({ usuario, onFechar, onSalvarPermissoes, onTrocarPerfil, onRemover }: {
  usuario: UsuarioRegistro
  onFechar: () => void
  onSalvarPermissoes: (id: string, p: Permissao[]) => void
  onTrocarPerfil: (id: string, perfil: Perfil) => void
  onRemover: (id: string) => void
}) {
  const ativo = new Set(usuario.permissoes)

  function toggle(chave: Permissao) {
    const nova = new Set(ativo)
    nova.has(chave) ? nova.delete(chave) : nova.add(chave)
    onSalvarPermissoes(usuario.id, Array.from(nova))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-900/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onFechar()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl bg-white border border-brown-200 shadow-warm-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100">
          <div>
            <h3 className="text-base font-bold text-brown-900">{usuario.nome}</h3>
            <p className="text-xs text-brown-400">Gerenciar permissões e perfil</p>
          </div>
          <button onClick={onFechar} className="p-2 rounded-xl hover:bg-brown-50 text-brown-400 hover:text-brown-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Perfil */}
          <div>
            <p className="text-xs font-semibold text-brown-500 uppercase tracking-wider mb-2">Perfil</p>
            <div className="grid grid-cols-2 gap-2">
              {(['OPERADOR', 'DESENVOLVEDOR'] as Perfil[]).map(p => (
                <button
                  key={p}
                  onClick={() => onTrocarPerfil(usuario.id, p)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors
                    ${usuario.perfil === p
                      ? 'bg-brown-800 text-white border-brown-800'
                      : 'bg-white text-brown-600 border-brown-200 hover:bg-brown-50'}`}
                >
                  {p === 'DESENVOLVEDOR' ? 'Desenvolvedor' : 'Operador'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-brown-400 mt-1.5">Trocar o perfil redefine as permissões para o padrão.</p>
          </div>

          {/* Permissões */}
          <div>
            <p className="text-xs font-semibold text-brown-500 uppercase tracking-wider mb-2">Permissões</p>
            <div className="space-y-1.5">
              {CATALOGO_PERMISSOES.map(perm => {
                const on = ativo.has(perm.chave)
                return (
                  <button
                    key={perm.chave}
                    onClick={() => toggle(perm.chave)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors
                      ${on ? 'bg-brown-50 border-brown-200' : 'bg-white border-brown-100 hover:border-brown-200'}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-brown-900">{perm.label}</p>
                      <p className="text-[11px] text-brown-400">{perm.descricao}</p>
                    </div>
                    <span className={`w-9 h-5 rounded-full relative transition-colors shrink-0
                      ${on ? 'bg-brown-800' : 'bg-brown-200'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all
                        ${on ? 'left-4' : 'left-0.5'}`} />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={() => { if (confirm(`Remover ${usuario.nome}? O histórico de acessos é mantido.`)) onRemover(usuario.id) }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm
                       text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Remover usuário
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
