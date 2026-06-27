import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { getAuthState, signOut, type Profile, type UserRole } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface EmpresaRow {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  created_at: string
}
interface UsuarioRow {
  id: string
  nome: string | null
  email: string | null
  role: UserRole
  empresa_id: string | null
}

export const Route = createFileRoute('/super-admin')({
  beforeLoad: async () => {
    const { userId, profile } = await getAuthState()
    if (!userId) throw redirect({ to: '/login' })
    if (profile?.role !== 'super_admin') {
      throw redirect({ to: profile?.empresa_id ? '/dashboard' : '/setup' })
    }
    return { profile: profile as Profile }
  },
  loader: async () => {
    const [empresasRes, usuariosRes] = await Promise.all([
      supabase
        .from('empresas')
        .select('id, nome, telefone, email, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('usuarios').select('id, nome, email, role, empresa_id'),
    ])
    return {
      empresas: (empresasRes.data as EmpresaRow[] | null) ?? [],
      usuarios: (usuariosRes.data as UsuarioRow[] | null) ?? [],
    }
  },
  component: SuperAdminPage,
})

const roleLabel: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  colaborador: 'Colaborador',
}

function SuperAdminPage() {
  const router = useRouter()
  const { profile } = Route.useRouteContext()
  const { empresas, usuarios } = Route.useLoaderData()

  const nomePorEmpresa = new Map(empresas.map((e) => [e.id, e.nome]))
  const usuariosPorEmpresa = (id: string) =>
    usuarios.filter((u) => u.empresa_id === id).length

  async function handleLogout() {
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      <div className="island-shell rise-in rounded-3xl px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="island-kicker mb-1">Netão Apps</p>
            <h1 className="display-title text-2xl font-bold text-[var(--sea-ink)] sm:text-3xl">
              Painel Super Admin
            </h1>
            <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
              {profile.nome || profile.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] transition hover:border-[var(--chip-line)]"
          >
            Sair
          </button>
        </div>
        <div className="mt-5 flex gap-3">
          <div className="feature-card flex-1 rounded-2xl px-4 py-3">
            <p className="m-0 text-2xl font-bold text-[var(--lagoon-deep)]">{empresas.length}</p>
            <p className="m-0 text-xs uppercase tracking-wide text-[var(--sea-ink-soft)]">Empresas</p>
          </div>
          <div className="feature-card flex-1 rounded-2xl px-4 py-3">
            <p className="m-0 text-2xl font-bold text-[var(--lagoon-deep)]">{usuarios.length}</p>
            <p className="m-0 text-xs uppercase tracking-wide text-[var(--sea-ink-soft)]">Usuários</p>
          </div>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="island-kicker mb-2">Empresas</h2>
        {empresas.length === 0 ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">Nenhuma empresa cadastrada ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {empresas.map((e) => (
              <article key={e.id} className="feature-card rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="m-0 text-base font-semibold text-[var(--sea-ink)]">{e.nome}</h3>
                  <span className="text-xs text-[var(--sea-ink-soft)]">
                    {usuariosPorEmpresa(e.id)} usuário(s)
                  </span>
                </div>
                <p className="m-0 mt-1 text-sm text-[var(--sea-ink-soft)]">
                  {e.telefone || 'sem telefone'} ·{' '}
                  {new Date(e.created_at).toLocaleDateString('pt-BR')}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="island-kicker mb-2">Usuários</h2>
        <div className="flex flex-col gap-2">
          {usuarios.map((u) => (
            <article
              key={u.id}
              className="feature-card flex items-center justify-between gap-3 rounded-xl px-4 py-3"
            >
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-semibold text-[var(--sea-ink)]">
                  {u.nome || u.email}
                </p>
                <p className="m-0 truncate text-xs text-[var(--sea-ink-soft)]">
                  {u.empresa_id ? nomePorEmpresa.get(u.empresa_id) ?? '—' : 'sem empresa'}
                </p>
              </div>
              <span className="flex-shrink-0 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1 text-xs font-semibold text-[var(--lagoon-deep)]">
                {roleLabel[u.role]}
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
