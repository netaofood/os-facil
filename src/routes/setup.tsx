import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { getAuthState } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/setup')({
  beforeLoad: async () => {
    const { userId, profile } = await getAuthState()
    if (!userId) throw redirect({ to: '/login' })
    if (profile?.role === 'super_admin') throw redirect({ to: '/super-admin' })
    if (profile?.empresa_id) throw redirect({ to: '/dashboard' })
    return { userId }
  },
  component: SetupPage,
})

function SetupPage() {
  const router = useRouter()
  const { userId } = Route.useRouteContext()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    try {
      const { data: empresa, error } = await supabase
        .from('empresas')
        .insert({ nome, telefone })
        .select('id')
        .single()
      if (error) throw error
      const empresaId = empresa.id as string

      const { error: e2 } = await supabase
        .from('usuarios')
        .update({ empresa_id: empresaId })
        .eq('id', userId)
      if (e2) throw e2

      // seeds padrão da empresa
      await supabase.from('status_os').insert([
        { empresa_id: empresaId, nome: 'Aberta', cor: '#008cff', ordem: 1 },
        { empresa_id: empresaId, nome: 'Em andamento', cor: '#f59e0b', ordem: 2 },
        { empresa_id: empresaId, nome: 'Aguardando aprovação', cor: '#a855f7', ordem: 3 },
        { empresa_id: empresaId, nome: 'Concluída', cor: '#22c55e', ordem: 4, is_final: true },
      ])
      await supabase.from('formas_pagamento').insert([
        { empresa_id: empresaId, nome: 'Dinheiro' },
        { empresa_id: empresaId, nome: 'PIX' },
        { empresa_id: empresaId, nome: 'Cartão de crédito' },
        { empresa_id: empresaId, nome: 'Cartão de débito' },
      ])

      await router.invalidate()
      await router.navigate({ to: '/dashboard' })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar a empresa')
      setLoading(false)
    }
  }

  return (
    <main className="page-wrap flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="island-shell rise-in w-full max-w-md rounded-3xl px-6 py-8 sm:px-8">
        <p className="island-kicker mb-1">Quase lá</p>
        <h1 className="display-title mb-1 text-2xl font-bold text-[var(--sea-ink)]">
          Cadastre sua empresa
        </h1>
        <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
          Esses dados aparecem nas suas ordens de serviço e orçamentos.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none focus:border-[var(--lagoon)]"
            placeholder="Nome da empresa"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <input
            className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none focus:border-[var(--lagoon)]"
            placeholder="Telefone / WhatsApp"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />

          {erro && <p className="m-0 text-sm text-red-500">{erro}</p>}

          <button type="submit" className="btn-primary mt-1 justify-center" disabled={loading}>
            {loading ? 'Salvando…' : 'Concluir cadastro'}
          </button>
        </form>
      </div>
    </main>
  )
}
