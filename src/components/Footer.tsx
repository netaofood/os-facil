export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-[var(--line)] px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p className="m-0 text-sm">© {year} Netão Apps · OS Fácil</p>
        <p className="island-kicker m-0">Soluções que te MOVEM, na palma da sua MÃO</p>
      </div>
    </footer>
  )
}
