import type { CSSProperties } from 'react'

/**
 * Shared style tokens — ALL values reference CSS custom properties
 * defined in globals.css so they respond correctly to both
 * light and dark themes without any inline hardcoding.
 *
 * Brand palette (defined in :root, never changed):
 *   --brand-volt  #0014bd   Volt Blue
 *   --brand-ash   #e9e9e9   Cloud Ash
 *   --brand-void  #000000   Deep Void
 *   --brand-neon  #dbff00   Neon Beam
 */

/* ── Inputs & Selects ── */
export const inputStyle: CSSProperties = {
  width: '100%',
  border: '1.5px solid var(--border-strong)',
  borderRadius: '10px',
  padding: '0.6rem 0.875rem',
  fontSize: '0.875rem',
  lineHeight: 1.5,
  backgroundColor: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 0.15s',
  appearance: 'none',
  WebkitAppearance: 'none',
}

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  marginBottom: '0.35rem',
  color: 'var(--text-secondary)',
}

export const hintStyle: CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--text-muted)',
  marginTop: '0.25rem',
}

/* ── Buttons ── */
export const btnPrimary: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  backgroundColor: 'var(--accent)',
  color: 'var(--text-on-volt)',
  fontWeight: 700,
  fontSize: '0.875rem',
  letterSpacing: '0.01em',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  padding: '0.6rem 1.25rem',
  transition: 'opacity 0.15s, transform 0.1s',
  whiteSpace: 'nowrap' as const,
}

export const btnSecondary: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  backgroundColor: 'transparent',
  color: 'var(--text-primary)',
  fontWeight: 600,
  fontSize: '0.875rem',
  borderRadius: '10px',
  border: '1.5px solid var(--border-strong)',
  cursor: 'pointer',
  padding: '0.6rem 1.25rem',
  transition: 'background-color 0.15s',
  whiteSpace: 'nowrap' as const,
}

export const btnNeon: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  backgroundColor: 'var(--neon)',
  color: 'var(--text-on-neon)',
  fontWeight: 700,
  fontSize: '0.875rem',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  padding: '0.6rem 1.25rem',
  transition: 'opacity 0.15s',
  whiteSpace: 'nowrap' as const,
}

export const selectStyle: CSSProperties = {
  border: '1.5px solid var(--border-strong)',
  borderRadius: '10px',
  padding: '0.5rem 1rem',
  fontSize: '0.84rem',
  fontWeight: 600,
  backgroundColor: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
}

/* ── Page heading ── */
export const pageTitle: CSSProperties = {
  fontSize: '1.45rem',
  fontWeight: 900,
  letterSpacing: '-0.02em',
  color: 'var(--text-primary)',
  lineHeight: 1.2,
}

export const pageSubtitle: CSSProperties = {
  fontSize: '0.825rem',
  color: 'var(--text-muted)',
  marginTop: '0.2rem',
}

/* ── Callouts ── */
export const calloutWarn: CSSProperties = {
  backgroundColor: 'var(--status-warn-bg)',
  border: '1px solid var(--accent-border)',
  borderRadius: '10px',
  padding: '0.65rem 0.875rem',
  fontSize: '0.78rem',
  lineHeight: 1.5,
  color: 'var(--status-warn-text)',
}

export const calloutInfo: CSSProperties = {
  backgroundColor: 'var(--status-info-bg)',
  border: '1px solid var(--border-default)',
  borderRadius: '10px',
  padding: '0.65rem 0.875rem',
  fontSize: '0.78rem',
  lineHeight: 1.5,
  color: 'var(--status-info-text)',
}

/* ── Progress track ── */
export const progressTrack: CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--progress-track)',
  borderRadius: '99px',
  height: '10px',
  overflow: 'hidden',
}

/* ── Table ── */
export const thStyle: CSSProperties = {
  paddingBottom: '0.65rem',
  paddingTop: '0.25rem',
  fontWeight: 700,
  fontSize: '0.72rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-muted)',
  textAlign: 'right' as const,
  borderBottom: '1.5px solid var(--border-default)',
}

export const trDivider: CSSProperties = {
  borderBottom: '1px solid var(--border-default)',
}

/* ── Row item ── */
export const rowItem: CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  borderRadius: '10px',
  padding: '0.75rem 1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

/* ── Delete / destructive icon button ── */
export const btnDestructive: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--destructive)',
  display: 'flex',
  padding: '4px',
  minHeight: '36px',
  minWidth: '36px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
}
