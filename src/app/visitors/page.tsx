'use client'
import { useState, useEffect } from 'react'
import { Users, PlusCircle, Eye, CheckCircle, UserX, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import { inputStyle, labelStyle, btnPrimary, btnSecondary } from '@/lib/styles'
import ExportButtons from '@/components/ExportButtons'
import { fmtDate } from '@/lib/export'
import type { CsvSheet, PdfOptions } from '@/lib/export'

interface Visitor {
  id: number; name: string; phone: string | null
  source: string | null; referredBy: string | null
  notes: string | null; visitDate: string; converted: boolean
}

const SOURCES = ['حملة تسويقية','دعوة عضو','تواصل اجتماعي','بحث مباشر','أخرى']

export default function VisitorsPage() {
  // Lazy initialisers — evaluated client-side only, not during SSR render.
  const [month, setMonth] = useState(1)
  const [year,  setYear]  = useState(2025)
  const [data,  setData]  = useState<{ visitors: Visitor[]; total: number; converted: number; conversionRate: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', phone:'', source:'', referredBy:'', notes:'', visitDate:'' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const d = new Date()
    setMonth(d.getMonth() + 1)
    setYear(d.getFullYear())
  }, [])
  useEffect(() => { load() }, [month, year])
  function load() {
    fetch(`/api/visitors?month=${month}&year=${year}`).then(r => r.json()).then(setData)
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    await fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false); setShowForm(false)
    setForm({ name:'', phone:'', source:'', referredBy:'', notes:'', visitDate:'' })
    load()
  }

  const AddBtn = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      {data && data.total > 0 && (
        <ExportButtons
          label="الزوار"
          onCSV={() => ({
            sheets: [{
              name: 'الزوار',
              headers: ['الاسم', 'الموبايل', 'المصدر', 'المُحيل', 'تاريخ الزيارة', 'الحالة'],
              rows: (data?.visitors ?? []).map(v => [
                v.name,
                v.phone ?? '',
                v.source ?? '',
                v.referredBy ?? '',
                fmtDate(v.visitDate),
                v.converted ? 'تحوّل لمشترك' : 'زيارة فقط',
              ]),
            } as CsvSheet],
            filename: 'الزوار',
          })}
          onPDF={() => {
            const visitors = data?.visitors ?? []
            const rows = visitors.map((v, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${v.name}</td>
                <td dir="ltr" style="text-align:right">${v.phone ?? '—'}</td>
                <td>${v.source ?? '—'}</td>
                <td>${v.referredBy ?? '—'}</td>
                <td dir="ltr" style="text-align:right">${fmtDate(v.visitDate)}</td>
                <td>${v.converted ? 'مشترك' : 'زيارة'}</td>
              </tr>`).join('')
            const body = `
              <div class="pdf-section">
                <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
                  <div class="kpi-card"><div class="kpi-label">إجمالي الزيارات</div><div class="kpi-value">${data?.total ?? 0}</div></div>
                  <div class="kpi-card"><div class="kpi-label">تحولوا لاشتراكات</div><div class="kpi-value">${data?.converted ?? 0}</div></div>
                  <div class="kpi-card"><div class="kpi-label">نسبة التحويل</div><div class="kpi-value">${data?.conversionRate ?? 0}%</div></div>
                </div>
              </div>
              <div class="pdf-section">
                <div class="pdf-section-title">قائمة الزوار</div>
                <table>
                  <thead><tr><th>#</th><th>الاسم</th><th>الموبايل</th><th>المصدر</th><th>المُحيل</th><th>التاريخ</th><th>الحالة</th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>`
            return { title: 'قائمة الزوار', body } as PdfOptions
          }}
        />
      )}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{ ...btnPrimary, padding: '0.5rem 1rem', minHeight: '44px' }}
      >
        <PlusCircle size={15} strokeWidth={2.5} />
        <span style={{ whiteSpace: 'nowrap' }}>إضافة زائر</span>
      </button>
    </div>
  )

  return (
    <div className="animate-fade-in" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <PageHeader
        title="الزوار"
        subtitle="تسجيل ومتابعة الزيارات ونسبة التحويل"
        month={month} year={year}
        onMonthChange={setMonth} onYearChange={setYear}
        actions={AddBtn}
      />

      {/* KPI strip — 1 col mobile → 3 col md+ */}
      {data && (
        <div className="grid-3col">
          <StatCard title="إجمالي الزيارات"  value={data.total}               icon={Eye}         color="blue"   />
          <StatCard title="تحولوا لاشتراكات" value={data.converted}            icon={CheckCircle} color="green"  />
          <StatCard title="نسبة التحويل"      value={`${data.conversionRate}%`} icon={Users}       color="yellow" />
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>تسجيل زيارة جديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="form-grid">
              <Field label="الاسم *">
                <input
                  required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }}
                  placeholder="اسم الزائر"
                />
              </Field>
              <Field label="رقم الموبايل">
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }}
                  placeholder="01xxxxxxxxx"
                  inputMode="tel"
                  /* phone input stays LTR so digits don't reverse */
                  dir="ltr"
                />
              </Field>
              <Field label="المصدر">
                <div style={{ position: 'relative' }}>
                  <select
                    value={form.source}
                    onChange={e => setForm({ ...form, source: e.target.value })}
                    style={{ ...inputStyle, minHeight: '44px', paddingLeft: '2rem' }}
                  >
                    <option value="">اختر المصدر...</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={13} strokeWidth={2.5} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </Field>
              <Field label="مُحيل بواسطة">
                <input
                  value={form.referredBy}
                  onChange={e => setForm({ ...form, referredBy: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }}
                  placeholder="اسم العضو الداعي"
                />
              </Field>
              <Field label="تاريخ الزيارة">
                <input
                  type="date"
                  value={form.visitDate}
                  onChange={e => setForm({ ...form, visitDate: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }}
                />
              </Field>
              <Field label="ملاحظات">
                <input
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={{ ...inputStyle, minHeight: '44px' }}
                  placeholder="ملاحظات..."
                />
              </Field>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="submit" disabled={loading}
                  style={{ ...btnPrimary, minHeight: '44px', flex: '1 1 140px', opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ الزائر'}
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

      {/* Visitors list card */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <Users size={17} strokeWidth={2} style={{ color: 'var(--color-volt-blue)', flexShrink: 0 }} />
              <CardTitle>قائمة الزوار</CardTitle>
            </div>
            {data && data.total > 0 && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums', flexShrink: 0,
              }}>
                {data.total} زيارة
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!data || data.visitors.length === 0 ? (
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
                <UserX size={24} strokeWidth={1.5} color="var(--text-disabled)" />
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                لا توجد زيارات في هذا الشهر
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '220px', lineHeight: 1.5 }}>
                سجّل زائراً جديداً بالضغط على زر «إضافة زائر»
              </p>
            </div>
          ) : (
            <>
              {/* ── Mobile card list (< 640px) ── */}
              <div className="mobile-card-list">
                {data.visitors.map(v => (
                  <VisitorMobileCard key={v.id} visitor={v} />
                ))}
              </div>

              {/* ── Desktop / tablet table (≥ 640px) ── */}
              <div className="table-desktop table-scroll">
                <table style={{ width: '100%', minWidth: '520px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      {['الاسم','الموبايل','المصدر','المُحيل','التاريخ','الحالة'].map(h => (
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
                    {data.visitors.map((v, idx) => (
                      <tr key={v.id} style={{
                        borderBottom: '1px solid var(--border-default)',
                        backgroundColor: idx % 2 !== 0 ? 'var(--bg-surface-2)' : 'transparent',
                      }}>
                        <td style={{ padding: '0.75rem 0.5rem 0.75rem 0', fontWeight: 700, color: 'var(--text-primary)', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.name}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', direction: 'ltr', textAlign: 'right' }}>
                          {v.phone || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {v.source || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {v.referredBy || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', direction: 'ltr', textAlign: 'right' }}>
                          {new Date(v.visitDate).toLocaleDateString('ar-EG')}
                        </td>
                        <td style={{ padding: '0.75rem 0' }}>
                          <Badge variant={v.converted ? 'neon' : 'warning'}>
                            {v.converted ? 'مشترك' : 'زيارة فقط'}
                          </Badge>
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

/* ── Mobile visitor card ── */
function VisitorMobileCard({ visitor: v }: { visitor: Visitor }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.875rem', borderRadius: '12px',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        backgroundColor: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.875rem', fontWeight: 900, color: 'var(--text-on-volt)',
      }}>
        {v.name.charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {v.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px', flexWrap: 'wrap' }}>
          {v.phone && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', direction: 'ltr' }}>
              {v.phone}
            </span>
          )}
          {v.source && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>· {v.source}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
        <Badge variant={v.converted ? 'neon' : 'warning'}>
          {v.converted ? 'مشترك' : 'زيارة'}
        </Badge>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', direction: 'ltr' }}>
          {new Date(v.visitDate).toLocaleDateString('ar-EG')}
        </span>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
