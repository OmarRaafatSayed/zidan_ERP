'use client'
import { useState, useEffect } from 'react'
import {
  Users, PlusCircle, Search, Phone, Mail,
  Calendar, FileX, ChevronDown, Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import { inputStyle, labelStyle, btnPrimary, btnSecondary } from '@/lib/styles'
import ExportButtons from '@/components/ExportButtons'
import { fmt, fmtDate } from '@/lib/export'
import type { CsvSheet, PdfOptions } from '@/lib/export'

interface Subscription {
  id: number
  branch: { name: string }
  amount: number
  startDate: string
  endDate: string
  status: string
  sessionType: string | null
}

interface Player {
  id: number
  name: string
  phone: string | null
  email: string | null
  birthDate: string | null
  notes: string | null
  createdAt: string
  subscriptions: Subscription[]
}

const statusLabel = (s: string) =>
  s === 'active' ? 'نشط' : s === 'expired' ? 'منتهي' : 'ملغي'
const statusVariant = (s: string): 'neon' | 'danger' | 'default' =>
  s === 'active' ? 'neon' : s === 'expired' ? 'danger' : 'default'

export default function PlayersPage() {
  const [players,   setPlayers]   = useState<Player[]>([])
  const [total,     setTotal]     = useState(0)
  const [query,     setQuery]     = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [expanded,  setExpanded]  = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '', phone: '', email: '', birthDate: '', notes: '',
  })

  useEffect(() => { load(query) }, [query])

  function load(q: string) {
    fetch(`/api/players?q=${encodeURIComponent(q)}&take=50`)
      .then(r => r.json())
      .then((d: Player[]) => {
        setPlayers(d)
        if (!q) setTotal(d.length)
      })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    setShowForm(false)
    setForm({ name: '', phone: '', email: '', birthDate: '', notes: '' })
    load(query)
  }

  const activeCount = players.filter(p =>
    p.subscriptions.some(s => s.status === 'active'),
  ).length

  /* ── CSV ── */
  function buildCSV(): { sheets: CsvSheet[]; filename: string } {
    const sheets: CsvSheet[] = [
      {
        name: 'اللاعبون',
        headers: ['الاسم', 'الموبايل', 'البريد', 'تاريخ الميلاد', 'عدد الاشتراكات', 'الحالة', 'ملاحظات'],
        rows: players.map(p => [
          p.name,
          p.phone ?? '',
          p.email ?? '',
          p.birthDate ? fmtDate(p.birthDate) : '',
          p.subscriptions.length,
          p.subscriptions.some(s => s.status === 'active') ? 'نشط' : 'غير نشط',
          p.notes ?? '',
        ]),
      },
    ]
    return { sheets, filename: 'قائمة-اللاعبين' }
  }

  /* ── PDF ── */
  function buildPDF(): PdfOptions {
    const rows = players.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.name}</td>
        <td dir="ltr" style="text-align:right">${p.phone ?? '—'}</td>
        <td>${p.subscriptions.length}</td>
        <td>${p.subscriptions.some(s => s.status === 'active') ? 'نشط' : 'غير نشط'}</td>
        <td>${p.birthDate ? fmtDate(p.birthDate) : '—'}</td>
      </tr>`).join('')

    const body = `
      <div class="pdf-section">
        <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
          <div class="kpi-card"><div class="kpi-label">إجمالي اللاعبين</div><div class="kpi-value">${total}</div></div>
          <div class="kpi-card"><div class="kpi-label">لاعبون نشطون</div><div class="kpi-value">${activeCount}</div></div>
          <div class="kpi-card"><div class="kpi-label">بدون اشتراك نشط</div><div class="kpi-value">${total - activeCount}</div></div>
        </div>
      </div>
      <div class="pdf-section">
        <div class="pdf-section-title">قائمة اللاعبين</div>
        <table>
          <thead><tr>
            <th>#</th><th>الاسم</th><th>الموبايل</th><th>الاشتراكات</th><th>الحالة</th><th>الميلاد</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`

    return { title: 'قائمة اللاعبين', subtitle: `${players.length} لاعب مسجل`, body }
  }

  return (
    <div className="animate-fade-in" dir="rtl"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <PageHeader
        title="اللاعبون"
        subtitle="كل اللاعبين المسجلين في الأكاديمية"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {players.length > 0 && (
              <ExportButtons onCSV={buildCSV} onPDF={buildPDF} label="اللاعبين" />
            )}
            <button
              onClick={() => setShowForm(v => !v)}
              style={{ ...btnPrimary, minHeight: '44px', padding: '0.5rem 1rem' }}
            >
              <PlusCircle size={15} strokeWidth={2.5} />
              <span style={{ whiteSpace: 'nowrap' }}>لاعب جديد</span>
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid-3col">
        <StatCard title="إجمالي اللاعبين"   value={total}       icon={Users} color="blue"  />
        <StatCard title="لاعبون نشطون"       value={activeCount} icon={Users} color="green" subtitle="اشتراك فعّال" />
        <StatCard title="بدون اشتراك نشط"   value={total - activeCount} icon={Users} color="muted" />
      </div>

      {/* Add form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>إضافة لاعب جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="form-grid">
              <Field label="الاسم *">
                <input required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }} placeholder="اسم اللاعب" />
              </Field>
              <Field label="رقم الموبايل">
                <input value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }} placeholder="01xxxxxxxxx"
                  dir="ltr" inputMode="tel" />
              </Field>
              <Field label="البريد الإلكتروني">
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }} placeholder="example@mail.com"
                  dir="ltr" />
              </Field>
              <Field label="تاريخ الميلاد">
                <input type="date" value={form.birthDate}
                  onChange={e => setForm({ ...form, birthDate: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }} />
              </Field>
              <Field label="ملاحظات" full>
                <input value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }} placeholder="ملاحظات..." />
              </Field>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="submit" disabled={loading}
                  style={{ ...btnPrimary, minHeight: '44px', flex: '1 1 140px', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'جاري الحفظ...' : 'حفظ اللاعب'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ ...btnSecondary, minHeight: '44px', flex: '0 0 auto' }}>
                  إلغاء
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} strokeWidth={2}
          style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="بحث بالاسم أو الموبايل..."
          style={{ ...inputStyle, paddingRight: '2.5rem', minHeight: '44px' }}
        />
      </div>

      {/* Players list */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={17} strokeWidth={2} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <CardTitle>قائمة اللاعبين</CardTitle>
            </div>
            {players.length > 0 && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {players.length} لاعب
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 1rem', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileX size={24} strokeWidth={1.5} color="var(--text-disabled)" />
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {query ? 'لا توجد نتائج' : 'لا يوجد لاعبون بعد'}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {query ? 'جرّب بحثاً آخر' : 'أضف لاعباً جديداً بالضغط على الزر أعلاه'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {players.map(p => {
                const latestSub = p.subscriptions[0]
                const isOpen    = expanded === p.id
                return (
                  <div key={p.id} style={{
                    borderRadius: '12px', border: '1px solid var(--border-default)',
                    overflow: 'hidden',
                    backgroundColor: isOpen ? 'var(--bg-surface)' : 'transparent',
                  }}>
                    {/* Row */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.875rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'right', minHeight: '56px',
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
                        backgroundColor: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-on-volt)',
                      }}>
                        {p.name.charAt(0)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px', flexWrap: 'wrap' }}>
                          {p.phone && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', direction: 'ltr' }}>
                              {p.phone}
                            </span>
                          )}
                          {latestSub && (
                            <Badge variant={statusVariant(latestSub.status)}>
                              {statusLabel(latestSub.status)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <ChevronDown size={16} strokeWidth={2} style={{
                        color: 'var(--text-muted)', flexShrink: 0,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }} />
                    </button>

                    {/* Expanded details */}
                    {isOpen && (
                      <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border-default)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.875rem' }}>
                          {p.phone && (
                            <DetailChip icon={Phone} label="الموبايل" value={p.phone} ltr />
                          )}
                          {p.email && (
                            <DetailChip icon={Mail} label="البريد" value={p.email} ltr />
                          )}
                          {p.birthDate && (
                            <DetailChip icon={Calendar} label="الميلاد"
                              value={new Date(p.birthDate).toLocaleDateString('ar-EG')} />
                          )}
                          <DetailChip icon={Users} label="الاشتراكات" value={`${p.subscriptions.length} اشتراك`} />
                        </div>

                        {p.subscriptions.length > 0 && (
                          <div style={{ marginTop: '0.875rem' }}>
                            <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                              الاشتراكات
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {p.subscriptions.map(s => (
                                <div key={s.id} style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  padding: '0.6rem 0.75rem', borderRadius: '8px',
                                  backgroundColor: 'var(--bg-surface-2)', gap: '0.5rem', flexWrap: 'wrap',
                                }}>
                                  <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                      {s.branch.name}
                                      {s.sessionType && (
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginRight: '0.4rem' }}>· {s.sessionType}</span>
                                      )}
                                    </p>
                                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px', fontVariantNumeric: 'tabular-nums', direction: 'ltr', textAlign: 'right' }}>
                                      {new Date(s.startDate).toLocaleDateString('ar-EG')} ←{' '}
                                      {new Date(s.endDate).toLocaleDateString('ar-EG')}
                                    </p>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                                      {s.amount.toLocaleString()} ج
                                    </span>
                                    <Badge variant={statusVariant(s.status)}>
                                      {statusLabel(s.status)}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {p.notes && (
                          <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-default)', paddingTop: '0.5rem' }}>
                            {p.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={full ? { gridColumn: '1/-1' } : {}}>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function DetailChip({ icon: Icon, label, value, ltr }: {
  icon: typeof Users; label: string; value: string; ltr?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
      padding: '0.5rem 0.625rem', borderRadius: '8px',
      backgroundColor: 'var(--bg-surface-2)',
    }}>
      <Icon size={13} strokeWidth={2} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '1px' }} />
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '1px' }}>{label}</p>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', direction: ltr ? 'ltr' : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </p>
      </div>
    </div>
  )
}
