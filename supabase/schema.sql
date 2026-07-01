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
