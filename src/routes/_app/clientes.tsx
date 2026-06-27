import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/auth'

interface Cliente {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  documento: string | null
  endereco: string | null
  observacoes: string | null
}

type Form = {
  nome: string
  telefone: string
  email: string
  documento: string
  endereco: string
  observacoes: string
}

const vazio: Form = { nome: '', telefone: '', email: '', documento: '', endereco: '', observacoes: '' }

export const Route = createFileRoute('/_app/clientes')({
  loader: async () => {
    const { data } = await supabase
      .from('clientes')
      .select('id, nome, telefone, email, documento, endereco, observacoes')
      .order('nome')
    return { clientes: (data as Cliente[] | null) ?? [] }
  },
  component: ClientesPage,
})

function ClientesPage() {
  const router = useRouter()
  const { profile } = Route.useRouteContext() as { profile: Profile }
  const { clientes } = Route.useLoaderData()

  const [aberto, setAberto] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(vazio)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  function abrirNovo() {
    setEditId(null)
    setForm(vazio)
    setErro(null)
    setAberto(true)
  }
  function abrirEdicao(c: Cliente) {
    setEditId(c.id)
    setForm({
      nome: c.nome,
      telefone: c.telefone ?? '',
      email: c.email ?? '',
      documento: c.documento ?? '',
      endereco: c.endereco ?? '',
      observacoes: c.observacoes ?? '',
    })
    setErro(null)
    setAberto(true)
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      if (editId) {
        const { error } = await supabase.from('clientes').update(form).eq('id', editId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert({ ...form, empresa_id: profile.empresa_id })
        if (error) throw error
      }
      setAberto(false)
      await router.invalidate()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(c: Cliente) {
    if (!confirm(`Excluir o cliente "${c.nome}"?`)) return
    const { error } = await supabase.from('clientes').delete().eq('id', c.id)
    if (error) {
      alert(error.message)
      return
    }
    await router.invalidate()
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="display-title text-2xl font-bold text-[var(--sea-ink)]">Clientes</h1>
        <button type="button" onClick={abrirNovo} className="btn-primary">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      {clientes.length === 0 ? (
        <div className="feature-card rounded-2xl p-8 text-center text-sm text-[var(--sea-ink-soft)]">
          Nenhum cliente ainda. Toque em <strong>Novo</strong> para cadastrar o primeiro.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {clientes.map((c) => (
            <article key={c.id} className="feature-card flex items-center justify-between gap-3 rounded-2xl p-4">
              <div className="min-w-0">
                <p className="m-0 truncate font-semibold text-[var(--sea-ink)]">{c.nome}</p>
                <p className="m-0 truncate text-sm text-[var(--sea-ink-soft)]">
                  {[c.telefone, c.email].filter(Boolean).join(' · ') || 'sem contato'}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => abrirEdicao(c)}
                  className="rounded-lg p-2 text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--lagoon-deep)]"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => excluir(c)}
                  className="rounded-lg p-2 text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-red-500"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {aberto && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="island-shell max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl px-6 py-6 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="m-0 text-lg font-bold text-[var(--sea-ink)]">
                {editId ? 'Editar cliente' : 'Novo cliente'}
              </h2>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="rounded-lg p-1">
                <X className="h-5 w-5 text-[var(--sea-ink-soft)]" />
              </button>
            </div>
            <form onSubmit={salvar} className="flex flex-col gap-3">
              {(
                [
                  ['nome', 'Nome', true],
                  ['telefone', 'Telefone / WhatsApp', false],
                  ['email', 'E-mail', false],
                  ['documento', 'CPF / CNPJ', false],
                  ['endereco', 'Endereço', false],
                  ['observacoes', 'Observações', false],
                ] as const
              ).map(([campo, label, req]) => (
                <input
                  key={campo}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none focus:border-[var(--lagoon)]"
                  placeholder={label}
                  value={form[campo]}
                  onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                  required={req}
                />
              ))}
              {erro && <p className="m-0 text-sm text-red-500">{erro}</p>}
              <button type="submit" className="btn-primary mt-1 justify-center" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
