import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/auth'

interface Produto {
  id: string
  nome: string
  descricao: string | null
  preco: number
  tipo: string
  ativo: boolean
}

type Form = { nome: string; descricao: string; preco: string; tipo: 'produto' | 'servico' }
const vazio: Form = { nome: '', descricao: '', preco: '', tipo: 'produto' }

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const Route = createFileRoute('/_app/produtos')({
  loader: async () => {
    const { data } = await supabase
      .from('produtos')
      .select('id, nome, descricao, preco, tipo, ativo')
      .order('nome')
    return { produtos: (data as Produto[] | null) ?? [] }
  },
  component: ProdutosPage,
})

function ProdutosPage() {
  const router = useRouter()
  const { profile } = Route.useRouteContext() as { profile: Profile }
  const { produtos } = Route.useLoaderData()

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
  function abrirEdicao(p: Produto) {
    setEditId(p.id)
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? '',
      preco: String(p.preco ?? ''),
      tipo: p.tipo === 'servico' ? 'servico' : 'produto',
    })
    setErro(null)
    setAberto(true)
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      const precoNum = Number(form.preco.replace(',', '.')) || 0
      const payload = {
        nome: form.nome,
        descricao: form.descricao,
        preco: precoNum,
        tipo: form.tipo,
      }
      if (editId) {
        const { error } = await supabase.from('produtos').update(payload).eq('id', editId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert({ ...payload, empresa_id: profile.empresa_id })
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

  async function excluir(p: Produto) {
    if (!confirm(`Excluir "${p.nome}"?`)) return
    const { error } = await supabase.from('produtos').delete().eq('id', p.id)
    if (error) {
      alert(error.message)
      return
    }
    await router.invalidate()
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="display-title text-2xl font-bold text-[var(--sea-ink)]">Produtos e serviços</h1>
        <button type="button" onClick={abrirNovo} className="btn-primary">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      {produtos.length === 0 ? (
        <div className="feature-card rounded-2xl p-8 text-center text-sm text-[var(--sea-ink-soft)]">
          Nenhum item ainda. Toque em <strong>Novo</strong> para cadastrar.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {produtos.map((p) => (
            <article key={p.id} className="feature-card flex items-center justify-between gap-3 rounded-2xl p-4">
              <div className="min-w-0">
                <p className="m-0 truncate font-semibold text-[var(--sea-ink)]">
                  {p.nome}
                  <span className="ml-2 rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--sea-ink-soft)]">
                    {p.tipo === 'servico' ? 'serviço' : 'produto'}
                  </span>
                </p>
                <p className="m-0 text-sm font-semibold text-[var(--lagoon-deep)]">{brl(p.preco)}</p>
              </div>
              <div className="flex flex-shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => abrirEdicao(p)}
                  className="rounded-lg p-2 text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--lagoon-deep)]"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => excluir(p)}
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
                {editId ? 'Editar item' : 'Novo item'}
              </h2>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="rounded-lg p-1">
                <X className="h-5 w-5 text-[var(--sea-ink-soft)]" />
              </button>
            </div>
            <form onSubmit={salvar} className="flex flex-col gap-3">
              <input
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none focus:border-[var(--lagoon)]"
                placeholder="Nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
              <input
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none focus:border-[var(--lagoon)]"
                placeholder="Descrição (opcional)"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
              <input
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none focus:border-[var(--lagoon)]"
                placeholder="Preço (ex: 150,00)"
                inputMode="decimal"
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
              />
              <select
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none focus:border-[var(--lagoon)]"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value === 'servico' ? 'servico' : 'produto' })}
              >
                <option value="produto">Produto</option>
                <option value="servico">Serviço</option>
              </select>
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
