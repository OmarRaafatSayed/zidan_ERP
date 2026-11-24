import React from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neon'

const styles: Record<BadgeVariant, React.CSSProperties> = {
  default: { backgroundColor: 'var(--bg-surface)',      color: 'var(--text-secondary)' },
  success: { backgroundColor: 'var(--accent)',           color: 'var(--text-on-volt)'   },
  warning: { backgroundColor: 'var(--accent-subtle)',    color: 'var(--accent)'         },
  danger:  { backgroundColor: 'var(--accent)',           color: 'var(--text-on-volt)'   },
  info:    { backgroundColor: 'var(--accent)',           color: 'var(--text-on-volt)'   },
  neon:    { backgroundColor: 'var(--neon)',             color: 'var(--text-on-neon)'   },
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: BadgeVariant
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '0.2rem 0.65rem', borderRadius: '99px',
      fontSize: '0.72rem', fontWeight: 700,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
      ...styles[variant],
    }}>
      {children}
    </span>
  )
}
