# OS Fácil — Netão Apps

SaaS multi-tenant (PWA) para **gestão de ordens de serviço**, voltado a micro
empresas de serviços: mecânicos, eletricistas, encanadores e técnicos em geral.

> Soluções que te MOVEM, na palma da sua MÃO.

## Stack
- React 19 + **TanStack Start** (SSR) + TanStack Router
- Tailwind CSS v4 + shadcn/ui
- TypeScript + Vite
- **Supabase** (Auth + Postgres + Storage + RLS)
- Deploy: **Vercel** (build automático via Nitro)

## Rodando localmente
1. Copie `.env.example` para `.env` e preencha com as chaves do seu projeto Supabase
   (Settings → API). São a **Project URL** e a **anon public key**.
2. `npm install`
3. `npm run dev`

## Banco de dados
As migrations ficam em `supabase/migrations/`. Rode o conteúdo de cada arquivo
no **SQL Editor** do Supabase, em ordem. A `0001_init.sql` cria todo o schema,
RLS, trigger de cadastro e o bucket de assinaturas.

> ⚠️ Antes de rodar a `0001`, troque `DONO@EXEMPLO.COM` pelo e-mail do dono da
> plataforma (vira `super_admin` automaticamente).

## Variáveis de ambiente (Vercel)
Em *Settings → Environment Variables*, adicione:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
