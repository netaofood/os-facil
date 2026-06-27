import { Link } from '@tanstack/react-router'
import { Home, Users, Package, ClipboardList } from 'lucide-react'

const items = [
  { to: '/dashboard', label: 'Início', Icon: Home },
  { to: '/clientes', label: 'Clientes', Icon: Users },
  { to: '/produtos', label: 'Produtos', Icon: Package },
  { to: '/os', label: 'OS', Icon: ClipboardList },
] as const

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-lg">
      <div className="page-wrap flex items-stretch justify-around px-2">
        {items.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[var(--sea-ink-soft)] no-underline"
            activeProps={{
              className:
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[var(--lagoon-deep)] no-underline',
            }}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[11px] font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
