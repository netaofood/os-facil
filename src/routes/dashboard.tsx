import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { getAuthState, signOut, type Profile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { userId, profile } = await getAuthState()
    if (!userId) throw redirect({ to: '/login' })
    if (!profile?.empresa_id) throw redirect({ to: '/setup' })
    return { profile: profile as Profile }
  },
  loader: async ({ context }) => {
    const { data } = await supabase
      .from('empresas')
      .select('nome')
      .eq('id', context.profile.empresa_id as string)
      .maybeSingle()
    return { empresaNome: (data?.nome as string | undefined) ?? '' }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const router = useRouter()
  const { profile } = Route.useRouteContext()
  const { empresaNome } = Route.useLoaderData()

  async function handleLogout() {
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }

  const proximos: Array<[string, string]> = [
    ['Clientes', 'Cadastro dos seus clientes.'],
    ['Produtos e serviços', 'Catálogo usado no autocomplete da OS.'],
    ['Ordens de Serviço', 'Crie, acompanhe e feche as OS.'],
    ['Agenda e faturas', 'Agendamentos e cobranças.'],
  ]

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      <div className="island-shell rise-in rounded-3xl px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="island-kicker mb-1">Painel</p>
            <h1 className="display-title text-2xl font-bold text-[var(--sea-ink)] sm:text-3xl">
              {empresaNome || 'Sua empresa'}
            </h1>
            <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
              {profile.nome || profile.email} ·{' '}
              <span className="font-semibold uppercase tracking-wide">{profile.role}</span>
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
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {proximos.map(([titulo, desc]) => (
          <article key={titulo} className="feature-card rounded-2xl p-5">
            <h2 className="mb-1 text-base font-semibold text-[var(--sea-ink)]">{titulo}</h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--kicker)]">
              Em breve
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}
