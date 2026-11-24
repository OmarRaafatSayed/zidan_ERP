'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'

/**
 * ThemeToggle — Night / Light mode switcher.
 *
 * Uses only CSS custom-property tokens so it looks correct in both themes
 * without any inline `isLight ? color1 : color2` branching.
 *
 * variant="sidebar" → labeled toggle pill for the desktop sidebar footer.
 * variant="nav"     → compact icon+label tile for the mobile more-sheet.
 */
export default function ThemeToggle({ variant = 'sidebar' }: { variant?: 'sidebar' | 'nav' }) {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'

  if (variant === 'nav') {
    return (
      <button
        onClick={toggleTheme}
        aria-label={isLight ? 'التبديل للوضع الليلي' : 'التبديل للوضع النهاري'}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem',
          padding: '0.875rem 0.5rem', borderRadius: '14px',
          border: 'none', cursor: 'pointer',
          backgroundColor: 'var(--bg-surface)',
          minHeight: '44px', width: '100%',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-surface-hover)')}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-surface)')}
      >
        {isLight
          ? <Moon size={22} strokeWidth={1.8} color="var(--accent)" />
          : <Sun  size={22} strokeWidth={1.8} color="var(--text-secondary)" />
        }
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {isLight ? 'ليلي' : 'نهاري'}
        </span>
      </button>
    )
  }

  /* ── Sidebar pill ── */
  return (
    <button
      onClick={toggleTheme}
      aria-label={isLight ? 'التبديل للوضع الليلي' : 'التبديل للوضع النهاري'}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        width: '100%', padding: '0.5rem 0.75rem',
        borderRadius: '10px',
        border: '1.5px solid var(--border-default)',
        backgroundColor: 'var(--bg-surface)',
        cursor: 'pointer', minHeight: '40px',
        textAlign: 'right' as const,
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-surface-hover)')}
      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-surface)')}
    >
      {/* Toggle track */}
      <div style={{
        position: 'relative', width: '32px', height: '18px',
        borderRadius: '99px',
        backgroundColor: isLight ? 'var(--accent)' : 'var(--border-strong)',
        flexShrink: 0,
      }}>
        {/* Thumb */}
        <div style={{
          position: 'absolute', top: '2px',
          right: isLight ? '2px' : '14px',
          width: '14px', height: '14px', borderRadius: '99px',
          backgroundColor: 'var(--bg-card)',
          transition: 'right 0.2s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isLight
            ? <Sun  size={8} strokeWidth={2.5} color="var(--accent)" />
            : <Moon size={8} strokeWidth={2.5} color="var(--text-muted)" />
          }
        </div>
      </div>

      {/* Labels */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {isLight ? 'وضع النهار' : 'وضع الليل'}
        </p>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '1px' }}>
          {isLight ? 'اضغط للوضع الليلي' : 'اضغط للوضع النهاري'}
        </p>
      </div>

      {isLight
        ? <Moon size={14} strokeWidth={2} color="var(--accent)"         style={{ flexShrink: 0 }} />
        : <Sun  size={14} strokeWidth={2} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
      }
    </button>
  )
}
