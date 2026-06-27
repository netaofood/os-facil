import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/os')({ component: OsPage })

function OsPage() {
  return (
    <div className="feature-card rounded-2xl p-8 text-center">
      <h1 className="display-title mb-2 text-xl font-bold text-[var(--sea-ink)]">
        Ordens de Serviço
      </h1>
      <p className="m-0 text-sm text-[var(--sea-ink-soft)]">Em construção — próxima etapa.</p>
    </div>
  )
}
