import type { ReactNode } from 'react'

interface ShellProps {
  brandAction: () => void
  children: ReactNode
  trailing?: ReactNode
  solid?: boolean
}

export function Shell({ brandAction, children, trailing, solid }: ShellProps) {
  return (
    <div className={`shell ${solid ? 'shell--solid' : ''}`}>
      <header className="topbar">
        <button type="button" className="brand" onClick={brandAction} aria-label="Kith home">
          <span className="brand__mark" aria-hidden="true" />
          <span className="brand__word">Kith</span>
        </button>
        <div className="topbar__trail">{trailing}</div>
      </header>
      <main className="shell__main">{children}</main>
    </div>
  )
}
