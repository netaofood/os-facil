import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const features: Array<[string, string]> = [
    ['Ordens de Serviço', 'Crie, acompanhe e feche OS com histórico completo.'],
    ['Orçamento no WhatsApp', 'Envie o orçamento e receba a aprovação com assinatura.'],
    ['Multi-empresa', 'Cada empresa com seus próprios dados, isolados e seguros.'],
    ['Instalável no celular', 'PWA: funciona como app, direto na tela inicial.'],
  ]

  return (
    <main className="page-wrap px-4 pb-12 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-10 sm:py-16">
        <p className="island-kicker mb-3">Netão Apps</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl font-bold leading-tight text-[var(--sea-ink)] sm:text-6xl">
          OS Fácil
        </h1>
        <p className="mb-8 max-w-xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Gestão de ordens de serviço na palma da mão. Para mecânicos,
          eletricistas, encanadores e técnicos que querem orçar, acompanhar e
          fechar OS em poucos toques.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/" className="btn-primary">Começar</Link>
        </div>
        <p className="mt-8 text-sm text-[var(--sea-ink-soft)]">
          Status do scaffold: <strong>app no ar ✓</strong> — próximos passos: banco,
          autenticação e dashboard.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(([title, desc], i) => (
          <article
            key={title}
            className="feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${i * 80 + 80}ms` }}
          >
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">{title}</h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
