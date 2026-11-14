-- Schema already deployed to wallet-qa-lab (independent sandbox) on 2026-11-14.
-- Intended for fresh independent installations. Do not run in existing production databases.
-- Stores QA test run metadata, never payment credentials or user transaction data.
create table if not exists public.wallet_qa_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  test_case_id text not null,
  status text not null check(status in ('pass', 'fail', 'blocked')),
  device_model text not null,
  os_version text not null,
  app_build text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.wallet_qa_defects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  severity text not null check(severity in ('P0', 'P1', 'P2', 'P3')),
  repro_steps text not null,
  expected_result text not null,
  actual_result text not null,
  sanitized_trace_id text,
  created_at timestamptz not null default now()
);
alter table public.wallet_qa_runs enable row level security;
alter table public.wallet_qa_defects enable row level security;
create policy "Owners can manage their QA runs" on public.wallet_qa_runs
for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Owners can manage their QA defects" on public.wallet_qa_defects
for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
-- No anonymous table access. Never expose service_role credentials in a browser.

-- Owner-scoped read performance for ordered history views.
create index if not exists wallet_qa_runs_owner_created_idx on public.wallet_qa_runs (owner_id, created_at desc);
create index if not exists wallet_qa_defects_owner_created_idx on public.wallet_qa_defects (owner_id, created_at desc);
-- Permission gating and RLS are both required.
revoke all on public.wallet_qa_runs, public.wallet_qa_defects from anon;
grant select, insert, update, delete on public.wallet_qa_runs, public.wallet_qa_defects to authenticated;
