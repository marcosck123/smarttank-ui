import { supabase } from './client'
import type { Perfil } from '@/context/AuthContext'
import { PERMISSOES_PADRAO } from '@/types/config'
import type { UsuarioRegistro, AcessoLog, AcaoAcesso, Permissao } from '@/types/config'
import { normalizar } from '@/lib/nome/validarNome'

const K_USUARIOS = 'smarttank:usuarios'
const K_ACESSOS  = 'smarttank:acessos'

// ── LocalStorage ────────────────────────────────────────────────────────────

function lerUsuarios(): UsuarioRegistro[] {
  try { return JSON.parse(localStorage.getItem(K_USUARIOS) ?? '[]') } catch { return [] }
}
function gravarUsuarios(l: UsuarioRegistro[]) { localStorage.setItem(K_USUARIOS, JSON.stringify(l)) }

function lerAcessos(): AcessoLog[] {
  try { return JSON.parse(localStorage.getItem(K_ACESSOS) ?? '[]') } catch { return [] }
}
function gravarAcessos(l: AcessoLog[]) { localStorage.setItem(K_ACESSOS, JSON.stringify(l.slice(0, 500))) }

function novoId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` }

// ── Serialização Supabase ─────────────────────────────────────────────────

interface UsuarioRow {
  id: string; nome: string; perfil: string; permissoes: string[]
  criado_em: string; ultimo_acesso: string; total_notas: number
}
interface AcessoRow { id: string; nome: string; perfil: string; acao: string; data_hora: string }

function rowParaUsuario(r: UsuarioRow): UsuarioRegistro {
  return {
    id: r.id, nome: r.nome, perfil: r.perfil as Perfil,
    permissoes: (r.permissoes ?? []) as Permissao[],
    criadoEm: r.criado_em, ultimoAcesso: r.ultimo_acesso, totalNotas: r.total_notas ?? 0,
  }
}
function usuarioParaRow(u: UsuarioRegistro): UsuarioRow {
  return {
    id: u.id, nome: u.nome, perfil: u.perfil, permissoes: u.permissoes,
    criado_em: u.criadoEm, ultimo_acesso: u.ultimoAcesso, total_notas: u.totalNotas,
  }
}

// ── API pública ─────────────────────────────────────────────────────────────

export async function carregarUsuarios(): Promise<UsuarioRegistro[]> {
  if (!supabase) return lerUsuarios().sort((a, b) => b.ultimoAcesso.localeCompare(a.ultimoAcesso))

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, perfil, permissoes, criado_em, ultimo_acesso, total_notas')
    .order('ultimo_acesso', { ascending: false })

  if (error || !data) { console.error('[Supabase] carregarUsuarios:', error?.message); return lerUsuarios() }
  const lista = (data as UsuarioRow[]).map(rowParaUsuario)
  gravarUsuarios(lista)
  return lista
}

export async function carregarAcessos(): Promise<AcessoLog[]> {
  if (!supabase) return lerAcessos()

  const { data, error } = await supabase
    .from('acessos')
    .select('id, nome, perfil, acao, data_hora')
    .order('data_hora', { ascending: false })
    .limit(300)

  if (error || !data) { console.error('[Supabase] carregarAcessos:', error?.message); return lerAcessos() }
  return (data as AcessoRow[]).map(r => ({
    id: r.id, nome: r.nome, perfil: r.perfil as Perfil, acao: r.acao as AcaoAcesso, dataHora: r.data_hora,
  }))
}

/**
 * Registra um acesso e faz upsert do usuário (cria se novo, atualiza último acesso).
 * Retorna o registro do usuário resultante.
 */
export async function registrarAcesso(nome: string, perfil: Perfil, acao: AcaoAcesso): Promise<UsuarioRegistro> {
  const agora = new Date().toISOString()
  const chave = normalizar(nome)

  // Upsert local
  const usuarios = lerUsuarios()
  let usuario = usuarios.find(u => normalizar(u.nome) === chave)
  if (usuario) {
    usuario.ultimoAcesso = agora
    if (usuario.perfil !== 'DESENVOLVEDOR') usuario.perfil = perfil
    if (acao === 'emissao_nota') usuario.totalNotas += 1
  } else {
    usuario = {
      id: novoId(), nome, perfil,
      permissoes: [...PERMISSOES_PADRAO[perfil]],
      criadoEm: agora, ultimoAcesso: agora,
      totalNotas: acao === 'emissao_nota' ? 1 : 0,
    }
    usuarios.push(usuario)
  }
  gravarUsuarios(usuarios)

  // Log local
  const acessos = lerAcessos()
  acessos.unshift({ id: novoId(), nome, perfil, acao, dataHora: agora })
  gravarAcessos(acessos)

  // Supabase (best-effort)
  if (supabase) {
    await supabase.from('usuarios').upsert(usuarioParaRow(usuario) as never, { onConflict: 'id' })
    await supabase.from('acessos').insert({
      id: novoId(), nome, perfil, acao, data_hora: agora,
    } as never)
  }

  return usuario
}

export async function atualizarPermissoes(id: string, permissoes: Permissao[]): Promise<void> {
  const usuarios = lerUsuarios().map(u => (u.id === id ? { ...u, permissoes } : u))
  gravarUsuarios(usuarios)
  if (supabase) {
    const { error } = await supabase.from('usuarios').update({ permissoes } as never).eq('id', id)
    if (error) console.error('[Supabase] atualizarPermissoes:', error.message)
  }
}

export async function atualizarPerfil(id: string, perfil: Perfil): Promise<void> {
  const usuarios = lerUsuarios().map(u =>
    u.id === id ? { ...u, perfil, permissoes: [...PERMISSOES_PADRAO[perfil]] } : u
  )
  gravarUsuarios(usuarios)
  if (supabase) {
    const alvo = usuarios.find(u => u.id === id)
    const { error } = await supabase
      .from('usuarios')
      .update({ perfil, permissoes: alvo?.permissoes ?? [] } as never)
      .eq('id', id)
    if (error) console.error('[Supabase] atualizarPerfil:', error.message)
  }
}

export async function excluirUsuario(id: string): Promise<void> {
  gravarUsuarios(lerUsuarios().filter(u => u.id !== id))
  if (supabase) {
    const { error } = await supabase.from('usuarios').delete().eq('id', id)
    if (error) console.error('[Supabase] excluirUsuario:', error.message)
  }
}

/** Lista de nomes conhecidos (para autocorreção no login). */
export function nomesConhecidos(): string[] {
  return lerUsuarios().map(u => u.nome)
}
