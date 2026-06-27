import { createFileRoute, Link } from '@tanstack/react-router'
import { Users, Package, ClipboardList } from 'lucide-react'

export const Route = createFileRoute('/_app/dashboard')({ component: DashboardPage })

function DashboardPage() {
  const atalhos = [
    { to: '/clientes', label: 'Clientes', desc: 'Cadastre seus clientes', Icon: Users },
    { to: '/produtos', label: 'Produtos e serviços', desc: 'Catálogo usado na OS', Icon: Package },
    { to: '/os', label: 'Ordens de Serviço', desc: 'Crie e acompanhe as OS', Icon: ClipboardList },
  ] as const

  return (
    <>
      <h1 className="display-title mb-4 text-2xl font-bold text-[var(--sea-ink)]">Início</h1>
      <section className="grid gap-4 sm:grid-cols-3">
        {atalhos.map(({ to, label, desc, Icon }) => (
          <Link key={to} to={to} className="feature-card rounded-2xl p-5 no-underline">
            <Icon className="mb-2 h-6 w-6 text-[var(--lagoon-deep)]" />
            <h2 className="mb-1 text-base font-semibold text-[var(--sea-ink)]">{label}</h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </Link>
        ))}
      </section>
    </>
  )
}
