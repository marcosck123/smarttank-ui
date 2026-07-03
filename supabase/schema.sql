-- ============================================================
-- SmartTank — Schema Supabase
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Tabela principal de medições
create table if not exists public.medicoes (
  id          text        primary key,          -- uuid gerado no cliente
  data_hora   timestamptz not null,
  operador    text        not null,
  observacoes text        not null default '',
  created_at  timestamptz not null default now()
);

-- Leituras individuais por tanque (1 linha por tanque por medição)
create table if not exists public.leituras_tanque (
  id            bigint      generated always as identity primary key,
  medicao_id    text        not null references public.medicoes(id) on delete cascade,
  tanque_id     smallint    not null,
  nome          text        not null,
  tipo          text        not null,
  comprimento_m numeric(5,3) not null,
  altura_cm     numeric(6,2) not null,
  volume_litros numeric(10,2) not null,
  percentual    numeric(5,2) not null
);

-- Índices para queries de histórico
create index if not exists idx_medicoes_data_hora on public.medicoes(data_hora desc);
create index if not exists idx_leituras_medicao   on public.leituras_tanque(medicao_id);

-- ── Row Level Security ─────────────────────────────────────────────────────
-- Por padrão, usando anon key com acesso público (sem auth).
-- Se quiser adicionar autenticação por usuário no futuro, ajuste aqui.

alter table public.medicoes        enable row level security;
alter table public.leituras_tanque enable row level security;

-- Políticas abertas para a anon key (ajuste conforme necessidade de segurança)
create policy "Leitura pública de medições"
  on public.medicoes for select using (true);

create policy "Inserção pública de medições"
  on public.medicoes for insert with check (true);

create policy "Atualização pública de medições"
  on public.medicoes for update using (true);

create policy "Exclusão pública de medições"
  on public.medicoes for delete using (true);

create policy "Leitura pública de leituras"
  on public.leituras_tanque for select using (true);

create policy "Inserção pública de leituras"
  on public.leituras_tanque for insert with check (true);

create policy "Atualização pública de leituras"
  on public.leituras_tanque for update using (true);

create policy "Exclusão pública de leituras"
  on public.leituras_tanque for delete using (true);

-- ── Arqueação: overrides do Dev (valores fixados manualmente) ──────────────
create table if not exists public.arqueacao_overrides (
  tanque_id     smallint    not null,
  altura_cm     smallint    not null,
  volume_litros numeric(10,2) not null,
  updated_at    timestamptz not null default now(),
  primary key (tanque_id, altura_cm)
);

alter table public.arqueacao_overrides enable row level security;

create policy "Leitura pública de overrides"
  on public.arqueacao_overrides for select using (true);
create policy "Inserção pública de overrides"
  on public.arqueacao_overrides for insert with check (true);
create policy "Atualização pública de overrides"
  on public.arqueacao_overrides for update using (true);
create policy "Exclusão pública de overrides"
  on public.arqueacao_overrides for delete using (true);

-- ── Usuários: registro de operadores + permissões ─────────────────────────
create table if not exists public.usuarios (
  id            text        primary key,
  nome          text        not null,
  perfil        text        not null default 'OPERADOR',
  permissoes    text[]      not null default '{}',
  criado_em     timestamptz not null default now(),
  ultimo_acesso timestamptz not null default now(),
  total_notas   integer     not null default 0
);

alter table public.usuarios enable row level security;

create policy "Leitura pública de usuários"
  on public.usuarios for select using (true);
create policy "Inserção pública de usuários"
  on public.usuarios for insert with check (true);
create policy "Atualização pública de usuários"
  on public.usuarios for update using (true);
create policy "Exclusão pública de usuários"
  on public.usuarios for delete using (true);

-- ── Acessos: log simples de entradas e emissões ───────────────────────────
create table if not exists public.acessos (
  id        text        primary key,
  nome      text        not null,
  perfil    text        not null,
  acao      text        not null,          -- 'login' | 'emissao_nota'
  data_hora timestamptz not null default now()
);

create index if not exists acessos_data_hora_idx on public.acessos (data_hora desc);

alter table public.acessos enable row level security;

create policy "Leitura pública de acessos"
  on public.acessos for select using (true);
create policy "Inserção pública de acessos"
  on public.acessos for insert with check (true);

-- ── Descargas: recebimentos detectados pela boia do TLS ───────────────────
create table if not exists public.descargas (
  id            text        primary key,
  tanque_id     smallint    not null,
  nome          text        not null,
  tipo          text        not null,
  volume_antes  numeric(10,2) not null,
  volume_depois numeric(10,2) not null,
  quantidade    numeric(10,2) not null,
  data_hora     timestamptz not null default now()
);

create index if not exists descargas_data_hora_idx on public.descargas (data_hora desc);

alter table public.descargas enable row level security;

create policy "Leitura pública de descargas"
  on public.descargas for select using (true);
create policy "Inserção pública de descargas"
  on public.descargas for insert with check (true);
