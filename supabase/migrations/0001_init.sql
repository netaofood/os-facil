-- =========================================================
-- OS Fácil — Migration 0001 (schema inicial + RLS + trigger + storage)
-- Netão Apps · "Soluções que te MOVEM, na palma da sua MÃO"
--
-- COMO USAR: cole TUDO no SQL Editor do Supabase e clique em "Run".
--
-- ✅ O e-mail do dono (super_admin) já está configurado como netaosushibar@gmail.com
--    Esse e-mail vira super_admin
--    automaticamente no cadastro.
-- =========================================================


-- ---------- 0. Tipos ----------
create type public.user_role as enum ('super_admin', 'admin', 'colaborador');


-- ---------- 1. Tabelas ----------

create table public.empresas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  logo_url    text,
  telefone    text,
  email       text,
  endereco    text,
  created_at  timestamptz not null default now()
);

-- usuarios.id = auth.users.id  →  permite "ler a própria linha" por auth.uid()
-- sem precisar de empresa_id (resolve o loading infinito da seção 5 do briefing).
create table public.usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  empresa_id  uuid references public.empresas(id) on delete set null,
  nome        text,
  email       text,
  role        public.user_role not null default 'admin',
  created_at  timestamptz not null default now()
);

create table public.clientes (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  nome        text not null,
  telefone    text,
  email       text,
  documento   text,
  endereco    text,
  observacoes text,
  created_at  timestamptz not null default now()
);

create table public.produtos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  nome        text not null,
  descricao   text,
  preco       numeric(12,2) not null default 0,
  tipo        text not null default 'produto',   -- 'produto' | 'servico'
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.status_os (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  nome        text not null,
  cor         text default '#64748b',
  ordem       int not null default 0,
  is_final    boolean not null default false,    -- marca status que "encerra" a OS
  created_at  timestamptz not null default now()
);

create table public.formas_pagamento (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  nome        text not null,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.ordens_servico (
  id                  uuid primary key default gen_random_uuid(),
  empresa_id          uuid not null references public.empresas(id) on delete cascade,
  numero              serial,                     -- nº amigável (sequência global p/ MVP)
  cliente_id          uuid references public.clientes(id) on delete set null,
  status_id           uuid references public.status_os(id) on delete set null,
  forma_pagamento_id  uuid references public.formas_pagamento(id) on delete set null,
  descricao           text,
  valor_total         numeric(12,2) not null default 0,
  desconto            numeric(12,2) not null default 0,
  token_publico       uuid not null default gen_random_uuid(),  -- link público do orçamento
  aprovada_em         timestamptz,
  assinatura_url      text,
  data_abertura       timestamptz not null default now(),
  data_conclusao      timestamptz,
  criado_por          uuid references public.usuarios(id) on delete set null,
  created_at          timestamptz not null default now()
);

create table public.itens_os (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  os_id           uuid not null references public.ordens_servico(id) on delete cascade,
  produto_id      uuid references public.produtos(id) on delete set null,
  descricao       text not null,
  quantidade      numeric(12,2) not null default 1,
  preco_unitario  numeric(12,2) not null default 0,
  created_at      timestamptz not null default now()
);

create table public.log_os (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  os_id       uuid not null references public.ordens_servico(id) on delete cascade,
  usuario_id  uuid references public.usuarios(id) on delete set null,
  acao        text not null,
  detalhe     text,
  created_at  timestamptz not null default now()
);

create table public.faturas (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  os_id       uuid references public.ordens_servico(id) on delete set null,
  cliente_id  uuid references public.clientes(id) on delete set null,
  valor       numeric(12,2) not null default 0,
  status      text not null default 'pendente',  -- pendente | pago | cancelado
  vencimento  date,
  pago_em     timestamptz,
  created_at  timestamptz not null default now()
);

create table public.agendamentos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  cliente_id  uuid references public.clientes(id) on delete set null,
  os_id       uuid references public.ordens_servico(id) on delete set null,
  titulo      text not null,
  inicio      timestamptz not null,
  fim         timestamptz,
  observacoes text,
  created_at  timestamptz not null default now()
);


-- ---------- 2. Funções auxiliares (SECURITY DEFINER → evitam recursão de RLS) ----------
-- Estas funções leem a tabela usuarios "por fora" do RLS. É o que impede o erro
-- clássico de recursão infinita quando a política de uma tabela consulta usuarios.

create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from public.usuarios where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and role = 'super_admin'
  );
$$;

grant execute on function public.current_empresa_id() to authenticated;
grant execute on function public.is_super_admin() to authenticated;


-- ---------- 3. Trigger: cria a linha em usuarios no cadastro do Auth ----------
-- ✅ Dono (super_admin) já configurado: netaosushibar@gmail.com

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, email, nome, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    case
      when new.email = 'netaosushibar@gmail.com' then 'super_admin'::public.user_role
      else 'admin'::public.user_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------- 4. Habilitar RLS em todas as tabelas ----------
alter table public.empresas         enable row level security;
alter table public.usuarios         enable row level security;
alter table public.clientes         enable row level security;
alter table public.produtos         enable row level security;
alter table public.status_os        enable row level security;
alter table public.formas_pagamento enable row level security;
alter table public.ordens_servico   enable row level security;
alter table public.itens_os         enable row level security;
alter table public.log_os           enable row level security;
alter table public.faturas          enable row level security;
alter table public.agendamentos     enable row level security;


-- ---------- 5. Políticas de USUARIOS (o ponto crítico do briefing) ----------

-- (a) ler SEMPRE a própria linha, mesmo com empresa_id nulo → sem loading infinito
create policy "usuarios_select_propria_linha"
  on public.usuarios for select
  using ( id = auth.uid() );

-- (b) ver colegas da mesma empresa
create policy "usuarios_select_mesma_empresa"
  on public.usuarios for select
  using ( empresa_id is not null and empresa_id = public.current_empresa_id() );

-- (c) super admin vê todos
create policy "usuarios_select_super_admin"
  on public.usuarios for select
  using ( public.is_super_admin() );

-- (d) atualizar a própria linha (no /setup, para vincular o empresa_id)
create policy "usuarios_update_propria_linha"
  on public.usuarios for update
  using ( id = auth.uid() )
  with check ( id = auth.uid() );

-- (e) super admin gerencia tudo
create policy "usuarios_all_super_admin"
  on public.usuarios for all
  using ( public.is_super_admin() )
  with check ( public.is_super_admin() );


-- ---------- 6. Políticas de EMPRESAS ----------

create policy "empresas_select"
  on public.empresas for select
  using ( id = public.current_empresa_id() or public.is_super_admin() );

-- qualquer usuário autenticado pode criar a empresa (fluxo /setup)
create policy "empresas_insert"
  on public.empresas for insert
  to authenticated
  with check ( true );

create policy "empresas_update"
  on public.empresas for update
  using ( id = public.current_empresa_id() or public.is_super_admin() )
  with check ( id = public.current_empresa_id() or public.is_super_admin() );


-- ---------- 7. Políticas das demais tabelas (isolamento por empresa) ----------
-- Padrão: cada empresa só enxerga os próprios dados; super_admin enxerga tudo.

create policy "clientes_tenant" on public.clientes for all
  using ( empresa_id = public.current_empresa_id() or public.is_super_admin() )
  with check ( empresa_id = public.current_empresa_id() or public.is_super_admin() );

create policy "produtos_tenant" on public.produtos for all
  using ( empresa_id = public.current_empresa_id() or public.is_super_admin() )
  with check ( empresa_id = public.current_empresa_id() or public.is_super_admin() );

create policy "status_os_tenant" on public.status_os for all
  using ( empresa_id = public.current_empresa_id() or public.is_super_admin() )
  with check ( empresa_id = public.current_empresa_id() or public.is_super_admin() );

create policy "formas_pagamento_tenant" on public.formas_pagamento for all
  using ( empresa_id = public.current_empresa_id() or public.is_super_admin() )
  with check ( empresa_id = public.current_empresa_id() or public.is_super_admin() );

create policy "ordens_servico_tenant" on public.ordens_servico for all
  using ( empresa_id = public.current_empresa_id() or public.is_super_admin() )
  with check ( empresa_id = public.current_empresa_id() or public.is_super_admin() );

create policy "itens_os_tenant" on public.itens_os for all
  using ( empresa_id = public.current_empresa_id() or public.is_super_admin() )
  with check ( empresa_id = public.current_empresa_id() or public.is_super_admin() );

create policy "log_os_tenant" on public.log_os for all
  using ( empresa_id = public.current_empresa_id() or public.is_super_admin() )
  with check ( empresa_id = public.current_empresa_id() or public.is_super_admin() );

create policy "faturas_tenant" on public.faturas for all
  using ( empresa_id = public.current_empresa_id() or public.is_super_admin() )
  with check ( empresa_id = public.current_empresa_id() or public.is_super_admin() );

create policy "agendamentos_tenant" on public.agendamentos for all
  using ( empresa_id = public.current_empresa_id() or public.is_super_admin() )
  with check ( empresa_id = public.current_empresa_id() or public.is_super_admin() );

-- OBS: a leitura PÚBLICA da OS (cliente sem login aprovando o orçamento pelo
-- token_publico) será adicionada na seção 8 da construção, via função RPC
-- dedicada — não abrimos a tabela inteira para o público agora.


-- ---------- 8. Storage: bucket de assinaturas ----------
insert into storage.buckets (id, name, public)
values ('assinaturas', 'assinaturas', true)
on conflict (id) do nothing;

create policy "assinaturas_public_read"
  on storage.objects for select
  using ( bucket_id = 'assinaturas' );

create policy "assinaturas_auth_insert"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'assinaturas' );

-- OBS: o upload da assinatura pelo cliente público (sem login) será refinado
-- na seção 8 (provavelmente via edge function ou política para o role anon).


-- =========================================================
-- Fim da migration 0001. Próximo passo: scaffold do front (seção 1).
-- =========================================================
