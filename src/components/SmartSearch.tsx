'use client'
/**
 * SmartSearch — shared instant-autocomplete / typeahead.
 * All colors reference CSS custom-property tokens — theme-aware.
 */
import React, { useState, useEffect, useRef, useCallback, useId } from 'react'
import { Search, X, AlertCircle, ChevronRight } from 'lucide-react'
import { inputStyle, labelStyle } from '@/lib/styles'

export interface PlayerResult {
  id: number
  name: string
  phone: string | null
  subscriptions: { branch: { id: number; name: string } }[]
}

export interface SmartSearchProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  onSelect: (player: PlayerResult) => void
  onClear?: () => void
  branchId?: string | null
  branchLabel?: string
  confirmed?: boolean
  hint?: string
  minChars?: number
  autoFocus?: boolean
}

function normalise(s: string) {
  return s.trim()
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ').toLowerCase()
}

export default function SmartSearch({
  label, placeholder = 'ابحث بالاسم أو الموبايل...',
  value, onChange, onSelect, onClear,
  branchId, branchLabel, confirmed = false,
  hint, minChars = 2, autoFocus = false,
}: SmartSearchProps) {
  const [results,       setResults]       = useState<PlayerResult[]>([])
  const [status,        setStatus]        = useState<'idle'|'loading'|'found'|'not-found'>('idle')
  const [open,          setOpen]          = useState(false)
  const [activeIdx,     setActiveIdx]     = useState(-1)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const inputRef    = useRef<HTMLInputElement>(null)
  const listRef     = useRef<HTMLUListElement>(null)
  const wrapRef     = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listboxId   = useId()

  const positionDropdown = useCallback(() => {
    if (!wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const preferBelow = spaceBelow >= 220 || spaceBelow >= spaceAbove
    setDropdownStyle({
      position: 'fixed', left: rect.left, width: rect.width, zIndex: 9999,
      ...(preferBelow
        ? { top:    rect.bottom + 4, maxHeight: Math.min(spaceBelow - 20, 320) }
        : { bottom: window.innerHeight - rect.top + 4, maxHeight: Math.min(spaceAbove - 20, 320) }),
    })
  }, [])

  useEffect(() => {
    if (confirmed) { setOpen(false); return }
    if (value.length < minChars) { setResults([]); setStatus('idle'); setOpen(false); return }
    setStatus('loading')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const url = new URL('/api/players', window.location.origin)
        url.searchParams.set('q', value.trim())
        if (branchId) url.searchParams.set('branchId', branchId)
        const data = await fetch(url.toString()).then(r => r.json()) as PlayerResult[]
        setResults(data)
        setStatus(data.length > 0 ? 'found' : 'not-found')
        setOpen(true)
        setActiveIdx(-1)
        positionDropdown()
      } catch { setStatus('idle') }
    }, 260)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value, branchId, confirmed, minChars, positionDropdown])

  useEffect(() => {
    if (!open) return
    const update = () => positionDropdown()
    window.addEventListener('scroll', update, { passive: true, capture: true })
    window.addEventListener('resize', update, { passive: true })
    return () => { window.removeEventListener('scroll', update, { capture: true }); window.removeEventListener('resize', update) }
  }, [open, positionDropdown])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => { if (autoFocus) setTimeout(() => inputRef.current?.focus(), 120) }, [autoFocus])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); const n = Math.min(activeIdx+1, results.length-1); setActiveIdx(n); scrollItem(n) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const n = Math.max(activeIdx-1, 0); setActiveIdx(n); scrollItem(n) }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0 && results[activeIdx]) pick(results[activeIdx]) }
    else if (e.key === 'Escape') { setOpen(false); setActiveIdx(-1) }
  }
  function scrollItem(idx: number) { (listRef.current?.children[idx] as HTMLElement|undefined)?.scrollIntoView({ block: 'nearest' }) }
  function pick(p: PlayerResult) { onSelect(p); setOpen(false); setActiveIdx(-1) }
  function handleClear() { onChange(''); setResults([]); setStatus('idle'); setOpen(false); onClear?.(); setTimeout(() => inputRef.current?.focus(), 50) }

  const isScoped  = Boolean(branchId)
  const showClear = value.length > 0 && !confirmed
  const notFoundMsg = isScoped
    ? (branchLabel ? `غير موجود في ${branchLabel}` : 'غير موجود في هذا الفرع')
    : 'غير موجود في النظام'

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {label && <label style={labelStyle}>{label}</label>}

      <div style={{ position: 'relative' }}>
        <Search size={15} strokeWidth={2} style={{
          position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
          color: status === 'loading' ? 'var(--accent)' : confirmed ? 'var(--neon-text)' : 'var(--text-muted)',
          pointerEvents: 'none',
        }} />
        <input
          ref={inputRef} type="text" value={value}
          onChange={e => { onChange(e.target.value); if (confirmed) onClear?.() }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0 && !confirmed) { positionDropdown(); setOpen(true) } }}
          placeholder={placeholder}
          autoComplete="off" autoCorrect="off" spellCheck={false} dir="rtl" inputMode="text"
          aria-autocomplete="list"
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={activeIdx >= 0 ? `ss-opt-${activeIdx}` : undefined}
          style={{
            ...inputStyle,
            paddingRight: '2.25rem',
            paddingLeft:  showClear ? '2.25rem' : '0.875rem',
            minHeight: '48px',
            borderColor: confirmed ? 'var(--neon-border)' : undefined,
          }}
        />
        {showClear && (
          <button type="button" onClick={handleClear} aria-label="مسح البحث" tabIndex={-1}
            style={{
              position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '4px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '28px', minHeight: '28px',
            }}>
            <X size={13} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {hint && !open && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{hint}</p>
      )}

      {open && !confirmed && (
        <ul ref={listRef} id={listboxId} role="listbox" aria-label="نتائج البحث"
          style={{
            ...dropdownStyle, margin: 0, padding: '0.375rem',
            backgroundColor: 'var(--bg-card)',
            border: '1.5px solid var(--border-accent)',
            borderRadius: '14px', boxShadow: 'var(--shadow-dropdown)',
            overflowY: 'auto', listStyle: 'none', overscrollBehavior: 'contain',
          }}
        >
          {status === 'not-found' ? (
            <li style={{ padding: '0.875rem 0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: isScoped ? '0.625rem' : 0 }}>
                <AlertCircle size={15} strokeWidth={2} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {notFoundMsg}
                </span>
              </div>
              {isScoped && (
                <button type="button" onClick={() => { onClear?.(); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '0.45rem 0.5rem', borderRadius: '8px',
                    fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)',
                    width: '100%', textAlign: 'right',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent-subtle)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
                >
                  <ChevronRight size={12} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
                  البحث في كل الفروع
                </button>
              )}
            </li>
          ) : results.map((p, i) => {
            const branchTag = p.subscriptions[0]?.branch.name ?? null
            const isActive  = i === activeIdx
            return (
              <li key={p.id} id={`ss-opt-${i}`} role="option" aria-selected={isActive}
                onClick={() => pick(p)} onMouseEnter={() => setActiveIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.6rem 0.75rem', borderRadius: '10px', cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--accent-hover)' : 'transparent',
                  minHeight: '44px',
                }}
              >
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--accent-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 900,
                  color: isActive ? 'var(--text-on-volt)' : 'var(--accent)',
                }}>
                  {p.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </p>
                  {p.phone && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', direction: 'ltr', textAlign: 'right', marginTop: '1px' }}>
                      {p.phone}
                    </p>
                  )}
                </div>
                {!branchId && branchTag && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '0.15rem 0.5rem', borderRadius: '6px', flexShrink: 0,
                    backgroundColor: 'var(--accent-subtle)',
                    fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)',
                    whiteSpace: 'nowrap',
                  }}>
                    {branchTag}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
