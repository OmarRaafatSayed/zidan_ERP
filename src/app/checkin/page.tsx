'use client'
import { useState, useEffect, useCallback } from 'react'
import { UserCheck, CheckCircle2, Clock, Building2, ScanLine } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/PageHeader'
import SmartSearch, { type PlayerResult } from '@/components/SmartSearch'
import { labelStyle, btnPrimary } from '@/lib/styles'

interface Branch  { id: number; name: string }
interface CheckIn {
  id: number
  player: { name: string; phone: string | null }
  branch: { name: string }
  checkInAt: string
  notes: string | null
}

/** Sentinel value meaning "all branches" */
const ALL_BRANCHES = '__all__'

export default function CheckInPage() {
  const [branches,  setBranches]  = useState<Branch[]>([])
  const [checkIns,  setCheckIns]  = useState<CheckIn[]>([])

  /* branch selector — empty string = "اختر الفرع", ALL_BRANCHES = "الكل" */
  const [branchId,  setBranchId]  = useState('')

  /* SmartSearch state */
  const [query,     setQuery]     = useState('')
  const [selected,  setSelected]  = useState<PlayerResult | null>(null)

  const [notes,     setNotes]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState('')

  useEffect(() => {
    fetch('/api/branches').then(r => r.json()).then(setBranches)
    loadToday()
  }, [])

  function loadToday() {
    // new Date() is called inside a plain function that is only ever
    // invoked from useEffect or event handlers — never during render.
    const today = new Date().toISOString().split('T')[0]
    fetch(`/api/checkin?date=${today}`).then(r => r.json()).then(setCheckIns)
  }

  /* ── Branch-change handler: clear player selection ── */
  function handleBranchChange(val: string) {
    setBranchId(val)
    setSelected(null)
    setQuery('')
  }

  /* ── SmartSearch callbacks ── */
  function handleSelect(player: PlayerResult) {
    setSelected(player)
    setQuery(player.name + (player.phone ? '  ·  ' + player.phone : ''))
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
  }

  /* ── "Search all branches" escape hatch (triggered from not-found state) ── */
  const handleSearchAll = useCallback(() => {
    setBranchId(ALL_BRANCHES)
    setSelected(null)
    /* keep the query so the search re-fires against all branches */
  }, [])

  /* Actual branchId to send to API — null when "all" or nothing selected */
  const apibranchId =
    branchId === '' || branchId === ALL_BRANCHES ? null : branchId

  /* Label for the currently selected branch */
  const branchLabel =
    apibranchId
      ? branches.find(b => String(b.id) === apibranchId)?.name ?? undefined
      : undefined

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    /* Require a specific branch for actual submission */
    const submitBranch =
      branchId === '' || branchId === ALL_BRANCHES ? '' : branchId
    if (!submitBranch) return

    setLoading(true)
    const isPhone = /^\d+$/.test(query.trim())
    const payload: Record<string, unknown> = {
      branchId: parseInt(submitBranch),
      notes: notes || undefined,
    }

    if (selected) {
      /* Confirmed pick — send by ID to avoid ambiguity */
      payload.playerId = selected.id
    } else if (isPhone) {
      payload.phone = query.trim()
    } else {
      payload.name = query.trim()
    }

    const res  = await fetch('/api/checkin', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setSuccess(data.player?.name ?? query)
      setQuery(''); setNotes(''); setSelected(null)
      loadToday()
      setTimeout(() => setSuccess(''), 3500)
    }
  }

  /* ── Submission guard ── */
  const needsBranch   = branchId === '' || branchId === ALL_BRANCHES
  const submitBranch  = needsBranch ? '' : branchId
  const canSubmit     = !!submitBranch && query.trim().length >= 2 && !loading

  return (
    <div className="animate-fade-in" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <PageHeader title="تسجيل الحضور" subtitle="تسجيل سريع باستخدام رقم الموبايل أو الاسم" />

      <div className="grid-2col">

        {/* ── Quick check-in form ── */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={17} strokeWidth={2} style={{ color: 'var(--color-volt-blue)', flexShrink: 0 }} />
              <CardTitle>تسجيل حضور سريع</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Success banner */}
              {success && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  backgroundColor: 'var(--status-success-bg)',
                  border: '1.5px solid var(--accent-border)',
                  borderRadius: '10px',
                  padding: '0.75rem 0.875rem',
                }}>
                  <CheckCircle2 size={17} strokeWidth={2.5}
                    style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{
                    fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)',
                    minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    تم تسجيل حضور: {success}
                  </span>
                </div>
              )}

              {/* Branch selector */}
              <div>
                <label style={labelStyle}>الفرع</label>
                <div style={{ position: 'relative' }}>
                  <Building2
                    size={15} strokeWidth={2}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', color: 'var(--text-muted)',
                      pointerEvents: 'none', zIndex: 1,
                    }}
                  />
                  <select
                    value={branchId}
                    onChange={e => handleBranchChange(e.target.value)}
                    style={{
                      width: '100%',
                      border: '1.5px solid var(--border-strong)',
                      borderRadius: '10px',
                      padding: '0.6rem 2.25rem 0.6rem 0.875rem',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      minHeight: '48px',
                    }}
                  >
                    <option value="" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      اختر الفرع...
                    </option>
                    <option value={ALL_BRANCHES} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      🔍 الكل — كل الفروع
                    </option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch context hint */}
                {branchId === ALL_BRANCHES && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    البحث في كل الفروع · اختر فرعاً محدداً للتسجيل
                  </p>
                )}
              </div>

              {/* Smart search — branch-aware */}
              <SmartSearch
                label="بحث سريع (موبايل أو اسم)"
                placeholder="اكتب رقم الموبايل أو الاسم..."
                value={query}
                onChange={val => { setQuery(val); if (selected) setSelected(null) }}
                onSelect={handleSelect}
                onClear={handleClear}
                branchId={apibranchId}
                branchLabel={branchLabel}
                confirmed={!!selected}
                hint="أرقام فقط = موبايل · حروف = اسم"
                minChars={2}
                autoFocus
              />

              {/* Selected player confirmation chip */}
              {selected && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.625rem 0.875rem',
                  backgroundColor: 'var(--accent-subtle)',
                  border: '1.5px solid var(--accent-border)',
                  borderRadius: '10px',
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                    backgroundColor: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-on-volt)',
                  }}>
                    {selected.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {selected.name}
                    </p>
                    {selected.subscriptions[0] && (
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {selected.subscriptions[0].branch.name}
                      </p>
                    )}
                  </div>
                  <CheckCircle2 size={16} strokeWidth={2.5} color="var(--accent)" style={{ flexShrink: 0 }} />
                </div>
              )}

              {/* Need-branch warning when "all" is selected but trying to submit */}
              {branchId === ALL_BRANCHES && query.trim().length >= 2 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '10px',
                  fontSize: '0.78rem', color: 'var(--text-secondary)',
                }}>
                  يرجى اختيار فرع محدد للتسجيل
                </div>
              )}

              {/* Notes */}
              <div>
                <label style={labelStyle}>ملاحظة (اختياري)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظة اختيارية..."
                  style={{
                    width: '100%',
                    border: '1.5px solid var(--border-strong)',
                    borderRadius: '10px',
                    padding: '0.6rem 0.875rem',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    minHeight: '48px',
                  }}
                />
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  ...btnPrimary,
                  width: '100%',
                  padding: '0.875rem',
                  fontSize: '0.9375rem',
                  minHeight: '52px',
                  opacity: canSubmit ? 1 : 0.45,
                  gap: '0.5rem',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                <UserCheck size={18} strokeWidth={2.3} />
                {loading ? 'جاري التسجيل...' : 'تسجيل الحضور'}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* ── Today's list ── */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <Clock size={17} strokeWidth={2}
                  style={{ color: 'var(--color-volt-blue)', flexShrink: 0 }} />
                <CardTitle>حضور اليوم</CardTitle>
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.2rem 0.65rem', borderRadius: '99px',
                fontSize: '0.72rem', fontWeight: 700,
                backgroundColor: 'var(--color-volt-blue)',
                color: 'var(--color-cloud-ash)',
                flexShrink: 0, fontVariantNumeric: 'tabular-nums',
              }}>
                {checkIns.length} مسجل
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {checkIns.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '2.5rem 1rem', gap: '0.625rem', textAlign: 'center',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '0.25rem',
                }}>
                  <ScanLine size={22} strokeWidth={1.5} color="var(--text-disabled)" />
                </div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  لا توجد تسجيلات اليوم
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  استخدم النموذج لتسجيل الحضور
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '0.4rem',
                maxHeight: '400px', overflowY: 'auto',
                WebkitMaskImage: checkIns.length > 6
                  ? 'linear-gradient(to bottom, black 85%, transparent 100%)'
                  : undefined,
              }}>
                {checkIns.map((c, idx) => (
                  <div key={c.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    padding: '0.75rem 0.875rem',
                    borderRadius: '10px',
                    backgroundColor: idx % 2 === 0
                      ? 'var(--bg-surface)'
                      : 'var(--bg-surface-2)',
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{
                        fontWeight: 700, fontSize: '0.875rem',
                        color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {c.player.name}
                      </p>
                      {c.player.phone && (
                        <p style={{
                          fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px',
                          fontVariantNumeric: 'tabular-nums',
                          direction: 'ltr', textAlign: 'right',
                        }}>
                          {c.player.phone}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', flexShrink: 0 }}>
                      <Badge variant="neon">{c.branch.name}</Badge>
                      <span style={{
                        fontSize: '0.68rem', color: 'var(--text-muted)',
                        fontVariantNumeric: 'tabular-nums', direction: 'ltr',
                      }}>
                        {new Date(c.checkInAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
