'use client'
import React from 'react'
import { ChevronDown } from 'lucide-react'

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const YEARS  = [2024, 2025, 2026, 2027]

function SelectPill({ value, onChange, options }: {
  value: number
  onChange: (v: number) => void
  options: { label: string; value: number }[]
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          border: '1.5px solid var(--border-strong)',
          borderRadius: '10px',
          padding: '0.5rem 2rem 0.5rem 0.75rem',
          fontSize: '0.84rem', fontWeight: 700,
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          outline: 'none', cursor: 'pointer',
          minWidth: '90px', minHeight: '44px',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} strokeWidth={2.5}
        style={{ position: 'absolute', left: '0.55rem', pointerEvents: 'none', color: 'var(--text-muted)' }} />
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  month?: number
  year?: number
  onMonthChange?: (m: number) => void
  onYearChange?:  (y: number) => void
  actions?: React.ReactNode
}

export default function PageHeader({ title, subtitle, month, year, onMonthChange, onYearChange, actions }: PageHeaderProps) {
  const showDatePicker = month !== undefined && year !== undefined

  return (
    <div dir="rtl" style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: '0.75rem', flexWrap: 'wrap', rowGap: '0.75rem',
    }}>
      <div style={{ minWidth: 0, flex: '1 1 180px' }}>
        <h1 style={{
          fontSize: 'clamp(1.1rem,4vw,1.4rem)', fontWeight: 900,
          letterSpacing: '-0.025em', color: 'var(--text-primary)', lineHeight: 1.2,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
        {showDatePicker && onMonthChange && (
          <SelectPill value={month!} onChange={onMonthChange}
            options={MONTHS.map((m, i) => ({ label: m, value: i + 1 }))} />
        )}
        {showDatePicker && onYearChange && (
          <SelectPill value={year!} onChange={onYearChange}
            options={YEARS.map(y => ({ label: String(y), value: y }))} />
        )}
        {actions}
      </div>
    </div>
  )
}
