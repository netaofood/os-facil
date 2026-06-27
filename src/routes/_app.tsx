import { createFileRoute, redirect, Outlet, useRouter } from '@tanstack/react-router'
import { getAuthState, signOut, type Profile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const { userId, profile } = await getAuthState()
    if (!userId) throw redirect({ to: '/login' })
    if (profile?.role === 'super_admin') throw redirect({ to: '/super-admin' })
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
  component: AppLayout,
})

function AppLayout() {
  const router = useRouter()
  const { empresaNome } = Route.useLoaderData()

  async function sair() {
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }

  return (
    <div className="pb-28">
      <div className="page-wrap px-4 pt-6">
        <div className="island-shell flex items-center justify-between gap-3 rounded-2xl px-5 py-4">
          <div className="min-w-0">
            <p className="island-kicker">Empresa</p>
            <p className="m-0 truncate font-semibold text-[var(--sea-ink)]">
              {empresaNome || 'Sua empresa'}
            </p>
          </div>
          <button
            type="button"
            onClick={sair}
            className="flex-shrink-0 rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] transition hover:border-[var(--chip-line)]"
          >
            Sair
          </button>
        </div>
      </div>
      <div className="page-wrap px-4 pt-5">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
