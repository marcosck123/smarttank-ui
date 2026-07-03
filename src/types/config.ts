import type { Perfil } from '@/context/AuthContext'

/** Chaves de permissão que o DEV pode alternar por usuário. */
export type Permissao =
  | 'emitir_nota'
  | 'editar_nota'
  | 'excluir_nota'
  | 'ver_dashboard'
  | 'gerir_tanques'
  | 'ver_relatorios'

export interface PermissaoInfo {
  chave: Permissao
  label: string
  descricao: string
}

export const CATALOGO_PERMISSOES: PermissaoInfo[] = [
  { chave: 'emitir_nota',    label: 'Emitir Nota',        descricao: 'Criar e emitir notas de aferição' },
  { chave: 'editar_nota',    label: 'Editar Nota',        descricao: 'Corrigir notas já emitidas' },
  { chave: 'excluir_nota',   label: 'Excluir Nota',       descricao: 'Remover notas do histórico' },
  { chave: 'ver_dashboard',  label: 'Ver Dashboard',      descricao: 'Acessar o painel inicial e KPIs' },
  { chave: 'gerir_tanques',  label: 'Gerir Tanques',      descricao: 'Editar arqueação e configuração dos tanques' },
  { chave: 'ver_relatorios', label: 'Ver Relatórios',     descricao: 'Acessar relatórios de descarga e stock' },
]

/** Permissões padrão por perfil. */
export const PERMISSOES_PADRAO: Record<Perfil, Permissao[]> = {
  OPERADOR:      ['emitir_nota'],
  DESENVOLVEDOR: ['emitir_nota', 'editar_nota', 'excluir_nota', 'ver_dashboard', 'gerir_tanques', 'ver_relatorios'],
}

export interface UsuarioRegistro {
  id: string
  nome: string
  perfil: Perfil
  permissoes: Permissao[]
  criadoEm: string        // ISO
  ultimoAcesso: string    // ISO
  totalNotas: number
}

export type AcaoAcesso = 'login' | 'emissao_nota'

export interface AcessoLog {
  id: string
  nome: string
  perfil: Perfil
  acao: AcaoAcesso
  dataHora: string        // ISO
}
