import React from 'react'
import type { LucideIcon } from 'lucide-react'

export type StatCardColor = 'blue' | 'yellow' | 'green' | 'red' | 'muted'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: StatCardColor
  trend?: { label: string; positive: boolean }
}

/**
 * All color values reference CSS custom properties from globals.css.
 * They respond automatically to light/dark theme switching.
 */
const schemes: Record<StatCardColor, {
  card: React.CSSProperties
  iconWrap: React.CSSProperties
  iconColor: string
  valueColor: string
  labelColor: string
  hintColor: string
  divider: string
}> = {
  /* Volt Blue fill — primary brand card */
  blue: {
    card:       { backgroundColor: 'var(--accent)', border: 'none', boxShadow: 'none' },
    iconWrap:   { backgroundColor: 'rgba(255,255,255,0.15)' },
    iconColor:  'var(--text-on-volt)',
    valueColor: 'var(--text-on-volt)',
    labelColor: 'rgba(255,255,255,0.65)',
    hintColor:  'rgba(255,255,255,0.45)',
    divider:    'rgba(255,255,255,0.18)',
  },
  /* Neon accent — dark card, neon text only (no full neon fill) */
  yellow: {
    card:       { backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--neon-border)', boxShadow: 'var(--shadow-sm)' },
    iconWrap:   { backgroundColor: 'var(--neon-subtle)' },
    iconColor:  'var(--neon-text)',
    valueColor: 'var(--neon-text)',
    labelColor: 'var(--text-secondary)',
    hintColor:  'var(--text-muted)',
    divider:    'var(--border-default)',
  },
  /* Success / positive — volt blue border accent */
  green: {
    card:       { backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--accent)', boxShadow: 'var(--shadow-sm)' },
    iconWrap:   { backgroundColor: 'var(--accent-subtle)' },
    iconColor:  'var(--accent)',
    valueColor: 'var(--text-primary)',
    labelColor: 'var(--text-secondary)',
    hintColor:  'var(--text-muted)',
    divider:    'var(--border-default)',
  },
  /* Loss / alert — neon border, neon value */
  red: {
    card:       { backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--neon-border)', boxShadow: 'var(--shadow-sm)' },
    iconWrap:   { backgroundColor: 'var(--neon-subtle)' },
    iconColor:  'var(--neon-text)',
    valueColor: 'var(--neon-text)',
    labelColor: 'var(--text-secondary)',
    hintColor:  'var(--text-muted)',
    divider:    'var(--border-default)',
  },
  /* Muted — secondary context */
  muted: {
    card:       { backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' },
    iconWrap:   { backgroundColor: 'var(--bg-surface)' },
    iconColor:  'var(--accent)',
    valueColor: 'var(--text-primary)',
    labelColor: 'var(--text-secondary)',
    hintColor:  'var(--text-muted)',
    divider:    'var(--border-default)',
  },
}

export default function StatCard({
  title, value, subtitle, icon: Icon, color = 'blue', trend,
}: StatCardProps) {
  const s = schemes[color]

  return (
    <div
      style={{
        ...s.card,
        borderRadius: '18px',
        padding: '1.125rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
    >
      {/* Top row: label + icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: s.labelColor,
          lineHeight: 1.3, flex: 1, minWidth: 0,
        }}>
          {title}
        </span>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, ...s.iconWrap,
        }}>
          <Icon size={17} color={s.iconColor} strokeWidth={2.2} />
        </div>
      </div>

      {/* Value */}
      <div>
        <p style={{
          fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 900, lineHeight: 1,
          letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
          color: s.valueColor,
          marginBottom: (subtitle || trend) ? '0.4rem' : 0,
        }}>
          {value}
        </p>

        {(subtitle || trend) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            paddingTop: '0.4rem', borderTop: `1px solid ${s.divider}`,
          }}>
            {trend && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                fontSize: '0.72rem', fontWeight: 700,
                color: trend.positive ? 'var(--neon-text)' : 'var(--text-muted)',
              }}>
                {trend.positive ? '↑' : '↓'} {trend.label}
              </span>
            )}
            {subtitle && (
              <span style={{ fontSize: '0.72rem', color: s.hintColor, lineHeight: 1.3 }}>
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
