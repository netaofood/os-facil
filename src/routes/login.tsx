import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { destinoPadrao, getAuthState, signIn, signUp } from '@/lib/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { userId, profile } = await getAuthState()
    if (userId) throw redirect({ to: destinoPadrao(profile) })
  },
  component: LoginPage,
})

function traduzErro(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('already registered')) return 'Este e-mail já está cadastrado.'
  if (m.includes('at least 6')) return 'A senha precisa ter ao menos 6 caracteres.'
  return msg
}

function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setAviso(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, senha, nome)
        if (error) throw error
        const { error: e2 } = await signIn(email, senha)
        if (e2) {
          setAviso('Conta criada! Se for pedida confirmação por e-mail, confirme e faça login.')
          setMode('login')
          setLoading(false)
          return
        }
      } else {
        const { error } = await signIn(email, senha)
        if (error) throw error
      }
      await router.invalidate()
      await router.navigate({ to: '/dashboard' })
    } catch (err) {
      setErro(traduzErro(err instanceof Error ? err.message : 'Erro ao entrar'))
      setLoading(false)
    }
  }

  return (
    <main className="page-wrap flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="island-shell rise-in w-full max-w-sm rounded-3xl px-6 py-8 sm:px-8">
        <p className="island-kicker mb-1">Netão Apps</p>
        <h1 className="display-title mb-1 text-3xl font-bold text-[var(--sea-ink)]">OS Fácil</h1>
        <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
          {mode === 'login' ? 'Entre na sua conta.' : 'Crie sua conta.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <input
              className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none focus:border-[var(--lagoon)]"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          )}
          <input
            className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none focus:border-[var(--lagoon)]"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none focus:border-[var(--lagoon)]"
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          {erro && <p className="m-0 text-sm text-red-500">{erro}</p>}
          {aviso && <p className="m-0 text-sm text-[var(--lagoon-deep)]">{aviso}</p>}

          <button type="submit" className="btn-primary mt-1 justify-center" disabled={loading}>
            {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setErro(null)
            setAviso(null)
          }}
          className="mt-4 w-full text-center text-sm text-[var(--sea-ink-soft)] hover:text-[var(--lagoon-deep)]"
        >
          {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </main>
  )
}
