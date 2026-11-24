'use client'
import { useState, useEffect } from 'react'
import { ClipboardList, PlusCircle, ChevronDown, FileX } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/PageHeader'
import SmartSearch, { type PlayerResult } from '@/components/SmartSearch'
import { inputStyle, labelStyle, btnPrimary, btnSecondary, selectStyle } from '@/lib/styles'
import ExportButtons from '@/components/ExportButtons'
import { fmt, fmtDate } from '@/lib/export'
import type { CsvSheet, PdfOptions } from '@/lib/export'

interface Branch { id: number; name: string; year: string | null }
interface Subscription {
  id: number
  player: { name: string; phone: string | null }
  branch: { name: string }
  amount: number; startDate: string; endDate: string
  sessionType: string | null; status: string
}

const SESSION_TYPES = ['صباحي','مسائي','صباحي ومسائي']

type BadgeVar = 'neon' | 'danger' | 'default'
const sv = (s: string): BadgeVar => s === 'active' ? 'neon' : s === 'expired' ? 'danger' : 'default'
const sl = (s: string) => s === 'active' ? 'نشط' : s === 'expired' ? 'منتهي' : 'ملغي'

export default function SubscriptionsPage() {
  const [branches,      setBranches]      = useState<Branch[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [showForm,      setShowForm]      = useState(false)
  const [playerSearch,  setPlayerSearch]  = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerResult | null>(null)
  const [filterBranch,  setFilterBranch]  = useState('')
  const [form, setForm] = useState({
    playerId:'', branchId:'', amount:'', startDate:'', endDate:'', sessionType:'', notes:''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/branches').then(r => r.json()).then(setBranches)
    loadSubs()
  }, [])

  useEffect(() => {
    filterBranch
      ? fetch(`/api/subscriptions?branchId=${filterBranch}`).then(r => r.json()).then(setSubscriptions)
      : loadSubs()
  }, [filterBranch])

  function loadSubs() {
    fetch('/api/subscriptions').then(r => r.json()).then(setSubscriptions)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false); setShowForm(false)
    setForm({ playerId:'', branchId:'', amount:'', startDate:'', endDate:'', sessionType:'', notes:'' })
    setPlayerSearch(''); setSelectedPlayer(null); loadSubs()
  }

  const AddBtn = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      {subscriptions.length > 0 && (
        <ExportButtons
          label="الاشتراكات"
          onCSV={() => ({
            sheets: [{
              name: 'الاشتراكات',
              headers: ['اللاعب', 'الموبايل', 'الفرع', 'المبلغ (ج)', 'نوع السيشن', 'البداية', 'الانتهاء', 'الحالة'],
              rows: subscriptions.map(s => [
                s.player.name,
                s.player.phone ?? '',
                s.branch.name,
                fmt(s.amount),
                s.sessionType ?? '',
                fmtDate(s.startDate),
                fmtDate(s.endDate),
                sl(s.status),
              ]),
            } as CsvSheet],
            filename: 'الاشتراكات',
          })}
          onPDF={() => {
            const totalIncome = subscriptions.reduce((s, x) => s + x.amount, 0)
            const rows = subscriptions.map((s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${s.player.name}</td>
                <td>${s.branch.name}</td>
                <td class="amount">${fmt(s.amount)} ج</td>
                <td>${s.sessionType ?? '—'}</td>
                <td dir="ltr" style="text-align:right">${fmtDate(s.startDate)}</td>
                <td dir="ltr" style="text-align:right">${fmtDate(s.endDate)}</td>
                <td>${sl(s.status)}</td>
              </tr>`).join('')
            const body = `
              <div class="pdf-section">
                <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
                  <div class="kpi-card"><div class="kpi-label">إجمالي الاشتراكات</div><div class="kpi-value">${subscriptions.length}</div></div>
                  <div class="kpi-card"><div class="kpi-label">الاشتراكات النشطة</div><div class="kpi-value">${subscriptions.filter(s => s.status === 'active').length}</div></div>
                  <div class="kpi-card"><div class="kpi-label">إجمالي الإيرادات</div><div class="kpi-value">${fmt(totalIncome)} ج</div></div>
                </div>
              </div>
              <div class="pdf-section">
                <div class="pdf-section-title">قائمة الاشتراكات</div>
                <table>
                  <thead><tr><th>#</th><th>اللاعب</th><th>الفرع</th><th>المبلغ</th><th>السيشن</th><th>البداية</th><th>الانتهاء</th><th>الحالة</th></tr></thead>
                  <tbody>${rows}</tbody>
                  <tr class="total-row"><td colspan="3">الإجمالي</td><td>${fmt(totalIncome)} ج</td><td colspan="4"></td></tr>
                </table>
              </div>`
            return { title: 'قائمة الاشتراكات', body } as PdfOptions
          }}
        />
      )}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{ ...btnPrimary, padding: '0.5rem 1rem', minHeight: '44px' }}
      >
        <PlusCircle size={15} strokeWidth={2.5} />
        <span style={{ whiteSpace: 'nowrap' }}>اشتراك جديد</span>
      </button>
    </div>
  )

  return (
    <div className="animate-fade-in" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <PageHeader title="الاشتراكات" subtitle="إدارة اشتراكات اللاعبين لكل فرع" actions={AddBtn} />

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <ClipboardList size={15} strokeWidth={2} style={{ position: 'absolute', right: '0.75rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <ChevronDown size={13} strokeWidth={2.5} style={{ position: 'absolute', left: '0.65rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <select
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value)}
            style={{ ...selectStyle, paddingRight: '2.25rem', paddingLeft: '2rem', minHeight: '44px' }}
          >
            <option value="">كل الفروع</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {subscriptions.length} اشتراك
        </span>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle>تسجيل اشتراك جديد</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="form-grid">

              {/* Player search — SmartSearch (branch-aware) */}
              <div style={{ gridColumn: '1/-1' }}>
                <SmartSearch
                  label="البحث عن لاعب"
                  placeholder="ابحث بالاسم أو الموبايل..."
                  value={playerSearch}
                  onChange={v => {
                    setPlayerSearch(v)
                    if (selectedPlayer) {
                      setSelectedPlayer(null)
                      setForm(f => ({ ...f, playerId: '' }))
                    }
                  }}
                  onSelect={p => {
                    setSelectedPlayer(p)
                    setPlayerSearch(p.name + (p.phone ? '  ·  ' + p.phone : ''))
                    setForm(f => ({ ...f, playerId: String(p.id) }))
                  }}
                  onClear={() => {
                    setSelectedPlayer(null)
                    setPlayerSearch('')
                    setForm(f => ({ ...f, playerId: '' }))
                  }}
                  confirmed={!!selectedPlayer}
                  hint="اكتب حرفين على الأقل للبحث"
                />
              </div>

              {/* Branch */}
              <div>
                <label style={labelStyle}>الفرع</label>
                <select
                  required value={form.branchId}
                  onChange={e => setForm({ ...form, branchId: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }}
                >
                  <option value="">اختر الفرع...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}{b.year ? ` (${b.year})` : ''}</option>)}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label style={labelStyle}>المبلغ (ج)</label>
                <input
                  required type="number" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }}
                  placeholder="0" inputMode="numeric"
                />
              </div>

              {/* Session type */}
              <div>
                <label style={labelStyle}>نوع السيشن</label>
                <select
                  value={form.sessionType}
                  onChange={e => setForm({ ...form, sessionType: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }}
                >
                  <option value="">اختر...</option>
                  {SESSION_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Start date */}
              <div>
                <label style={labelStyle}>تاريخ البداية</label>
                <input
                  required type="date" value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }}
                />
              </div>

              {/* End date */}
              <div>
                <label style={labelStyle}>تاريخ الانتهاء</label>
                <input
                  required type="date" value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }}
                />
              </div>

              {/* Notes */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>ملاحظات</label>
                <input
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }}
                  placeholder="ملاحظات..."
                />
              </div>

              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="submit" disabled={loading || !form.playerId}
                  style={{ ...btnPrimary, minHeight: '44px', flex: '1 1 140px', opacity: (loading || !form.playerId) ? 0.5 : 1 }}
                >
                  {loading ? 'جاري الحفظ...' : 'تسجيل الاشتراك'}
                </button>
                <button
                  type="button" onClick={() => setShowForm(false)}
                  style={{ ...btnSecondary, minHeight: '44px', flex: '0 0 auto' }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Subscriptions list ── */}
      <Card>
        {subscriptions.length > 0 && (
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <CardTitle>قائمة الاشتراكات</CardTitle>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {subscriptions.length}
              </span>
            </div>
          </CardHeader>
        )}
        <CardContent>
          {subscriptions.length === 0 ? (
            /* ── Upgraded empty state ── */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '2.5rem 1rem', gap: '0.625rem', textAlign: 'center',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '0.25rem',
              }}>
                <FileX size={24} strokeWidth={1.5} color="var(--text-disabled)" />
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>لا توجد اشتراكات</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '220px', lineHeight: 1.5 }}>
                سجّل اشتراكاً جديداً بالضغط على «اشتراك جديد»
              </p>
            </div>
          ) : (
            <>
              {/* ── Mobile card list (< 640px) ── */}
              <div className="mobile-card-list">
                {subscriptions.map(s => (
                  <SubscriptionMobileCard key={s.id} sub={s} />
                ))}
              </div>

              {/* ── Desktop table (≥ 640px) ── */}
              <div className="table-desktop table-scroll">
                <table style={{ width: '100%', minWidth: '580px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      {['اللاعب','الفرع','المبلغ','السيشن','البداية','الانتهاء','الحالة'].map(h => (
                        <th key={h} style={{
                          padding: '0 0.5rem 0.75rem 0',
                          fontWeight: 700, fontSize: '0.7rem',
                          letterSpacing: '0.05em', textTransform: 'uppercase',
                          color: 'var(--text-muted)', textAlign: 'right',
                          borderBottom: '1.5px solid var(--border-default)',
                          whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s, idx) => (
                      <tr key={s.id} style={{
                        borderBottom: '1px solid var(--border-default)',
                        backgroundColor: idx % 2 !== 0 ? 'var(--bg-surface-2)' : 'transparent',
                      }}>
                        <td style={{ padding: '0.75rem 0.5rem 0.75rem 0', maxWidth: '130px' }}>
                          <p style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.player.name}
                          </p>
                          {s.player.phone && (
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', direction: 'ltr', textAlign: 'right' }}>
                              {s.player.phone}
                            </p>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {s.branch.name}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {s.amount.toLocaleString()} ج
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {s.sessionType || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'right' }}>
                          {new Date(s.startDate).toLocaleDateString('ar-EG')}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'right' }}>
                          {new Date(s.endDate).toLocaleDateString('ar-EG')}
                        </td>
                        <td style={{ padding: '0.75rem 0' }}>
                          <Badge variant={sv(s.status)}>{sl(s.status)}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ── Mobile subscription row card ── */
function SubscriptionMobileCard({ sub: s }: { sub: Subscription }) {
  return (
    <div style={{
      padding: '0.875rem',
      borderRadius: '12px',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      {/* Top row: name + status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.player.name}
          </p>
          {s.player.phone && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', direction: 'ltr', textAlign: 'right', marginTop: '1px' }}>
              {s.player.phone}
            </p>
          )}
        </div>
        <Badge variant={sv(s.status)}>{sl(s.status)}</Badge>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '0.15rem 0.5rem', borderRadius: '6px',
          backgroundColor: 'var(--accent-subtle)',
          fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)',
        }}>
          {s.branch.name}
        </span>
        {s.sessionType && (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0.15rem 0.5rem', borderRadius: '6px',
            backgroundColor: 'var(--bg-surface)',
            fontSize: '0.72rem', color: 'var(--text-secondary)',
          }}>
            {s.sessionType}
          </span>
        )}
      </div>

      {/* Bottom row: dates + amount */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', direction: 'ltr' }}>
          {new Date(s.startDate).toLocaleDateString('ar-EG')}
          <span style={{ color: 'var(--text-disabled)', margin: '0 0.25rem' }}>→</span>
          {new Date(s.endDate).toLocaleDateString('ar-EG')}
        </span>
        <span style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
          {s.amount.toLocaleString()} ج
        </span>
      </div>
    </div>
  )
}
