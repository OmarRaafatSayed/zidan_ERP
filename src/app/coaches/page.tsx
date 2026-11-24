'use client'
import { useState, useEffect } from 'react'
import { PersonStanding, PlusCircle, Pencil, Banknote, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/PageHeader'
import { inputStyle, labelStyle, hintStyle, btnPrimary, btnSecondary, btnNeon } from '@/lib/styles'

interface Coach {
  id: number; name: string; phone: string | null
  baseSalary: number; bonusRate: number
  salaries: { id: number; month: number; year: number; baseSalary: number; bonusAmount: number; totalPaid: number; paid: boolean }[]
}

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

export default function CoachesPage() {
  // Lazy initialisers — evaluated client-side only, not during SSR render.
  const [coaches,      setCoaches]      = useState<Coach[]>([])
  const [showAddCoach, setShowAddCoach] = useState(false)
  const [showSalary,   setShowSalary]   = useState<number | null>(null)
  const [coachForm,    setCoachForm]    = useState({ name:'', phone:'', baseSalary:'', bonusRate:'' })
  const [salaryForm,   setSalaryForm]   = useState({ month: 1, year: 2025, bonusAmount: '', applyBonus: false, notes: '', paid: false })
  const [loading,      setLoading]      = useState(false)
  const [editId,       setEditId]       = useState<number | null>(null)

  useEffect(() => {
    // Hydrate month/year on the client — avoids new Date() during SSR prerender
    const d = new Date()
    setSalaryForm(f => ({ ...f, month: d.getMonth() + 1, year: d.getFullYear() }))
    loadCoaches()
  }, [])
  function loadCoaches() { fetch('/api/coaches').then(r => r.json()).then(setCoaches) }

  async function saveCoach(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    await fetch(editId ? `/api/coaches/${editId}` : '/api/coaches', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coachForm),
    })
    setLoading(false); setShowAddCoach(false); setEditId(null)
    setCoachForm({ name:'', phone:'', baseSalary:'', bonusRate:'' }); loadCoaches()
  }

  async function saveSalary(e: React.FormEvent) {
    e.preventDefault(); if (!showSalary) return; setLoading(true)
    await fetch('/api/coaches/salary', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ coachId: showSalary, ...salaryForm }) })
    setLoading(false); setShowSalary(null)
    setSalaryForm(f => ({ ...f, bonusAmount:'', applyBonus:false, notes:'', paid:false }))
    loadCoaches()
  }

  function startEdit(c: Coach) {
    setCoachForm({ name: c.name, phone: c.phone||'', baseSalary: String(c.baseSalary), bonusRate: String(c.bonusRate * 100) })
    setEditId(c.id); setShowAddCoach(true)
  }

  const selectedCoach = coaches.find(c => c.id === showSalary)

  const AddBtn = (
    <button onClick={() => { setShowAddCoach(!showAddCoach); setEditId(null); setCoachForm({ name:'', phone:'', baseSalary:'', bonusRate:'' }) }}
      style={{ ...btnPrimary, padding: '0.5rem 1rem', minHeight: '44px' }}>
      <PlusCircle size={15} strokeWidth={2.5} />
      إضافة مدرب
    </button>
  )

  return (
    <div className="animate-fade-in" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <PageHeader title="المدربون والمرتبات" subtitle="إدارة بيانات المدربين والبونص" actions={AddBtn} />

      {/* Add/Edit Coach */}
      {showAddCoach && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PersonStanding size={16} strokeWidth={2} style={{ color: 'var(--color-volt-blue)', flexShrink: 0 }} />
              <CardTitle>{editId ? 'تعديل بيانات مدرب' : 'إضافة مدرب جديد'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveCoach} className="form-grid">
              <div>
                <label style={labelStyle}>الاسم</label>
                <input required value={coachForm.name} onChange={e => setCoachForm({...coachForm, name: e.target.value})}
                  style={{ ...inputStyle, minHeight: '44px' }} placeholder="اسم المدرب" />
              </div>
              <div>
                <label style={labelStyle}>الموبايل</label>
                <input value={coachForm.phone} onChange={e => setCoachForm({...coachForm, phone: e.target.value})}
                  style={{ ...inputStyle, minHeight: '44px' }} placeholder="01xxxxxxxxx" inputMode="tel" />
              </div>
              <div>
                <label style={labelStyle}>الراتب الأساسي (ج)</label>
                <input required type="number" value={coachForm.baseSalary} onChange={e => setCoachForm({...coachForm, baseSalary: e.target.value})}
                  style={{ ...inputStyle, minHeight: '44px' }} placeholder="0" inputMode="numeric" />
              </div>
              <div>
                <label style={labelStyle}>نسبة البونص (%)</label>
                <input type="number" min="0" max="100" value={coachForm.bonusRate} onChange={e => setCoachForm({...coachForm, bonusRate: e.target.value})}
                  style={{ ...inputStyle, minHeight: '44px' }} placeholder="20" inputMode="decimal" />
                <p style={hintStyle}>نسبة مئوية من الراتب عند تحقيق الهدف</p>
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="submit" disabled={loading} style={{ ...btnPrimary, minHeight: '44px', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'جاري الحفظ...' : (editId ? 'حفظ التعديلات' : 'إضافة المدرب')}
                </button>
                <button type="button" onClick={() => setShowAddCoach(false)} style={{ ...btnSecondary, minHeight: '44px' }}>إلغاء</button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Salary Panel */}
      {showSalary && selectedCoach && (
        <Card style={{ border: '2px solid var(--color-volt-blue)' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ width: '4px', height: '20px', borderRadius: '99px', backgroundColor: 'var(--color-neon-beam)', flexShrink: 0 }} />
              <CardTitle>صرف مرتب — {selectedCoach.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
              {/* Summary tiles */}
              <div className="grid-2col" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.875rem 1rem', borderRadius: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>الراتب الأساسي</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{selectedCoach.baseSalary.toLocaleString()} ج</p>
                </div>
                <div style={{ padding: '0.875rem 1rem', borderRadius: '10px', backgroundColor: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--accent)', marginBottom: '0.25rem' }}>نسبة البونص</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{(selectedCoach.bonusRate * 100).toFixed(0)}%</p>
                </div>
              </div>

            <form onSubmit={saveSalary} className="form-grid">
              <div>
                <label style={labelStyle}>الشهر</label>
                <select value={salaryForm.month} onChange={e => setSalaryForm({...salaryForm, month: parseInt(e.target.value)})}
                  style={{ ...inputStyle, minHeight: '44px' }}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>السنة</label>
                <select value={salaryForm.year} onChange={e => setSalaryForm({...salaryForm, year: parseInt(e.target.value)})}
                  style={{ ...inputStyle, minHeight: '44px' }}>
                  {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', cursor: 'pointer', minHeight: '44px' }}
                  onClick={() => setSalaryForm(f => ({...f, applyBonus: !f.applyBonus}))}>
                  <input type="checkbox" checked={salaryForm.applyBonus} onChange={() => {}} style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1, minWidth: 0 }}>تطبيق البونص التلقائي</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    + {(selectedCoach.baseSalary * selectedCoach.bonusRate).toLocaleString()} ج
                  </span>
                </label>
              </div>

              {!salaryForm.applyBonus && (
                <div>
                  <label style={labelStyle}>بونص يدوي (ج)</label>
                  <input type="number" min="0" value={salaryForm.bonusAmount} onChange={e => setSalaryForm({...salaryForm, bonusAmount: e.target.value})}
                    style={{ ...inputStyle, minHeight: '44px' }} placeholder="0" inputMode="numeric" />
                </div>
              )}

              <div>
                <label style={labelStyle}>ملاحظات</label>
                <input value={salaryForm.notes} onChange={e => setSalaryForm({...salaryForm, notes: e.target.value})}
                  style={{ ...inputStyle, minHeight: '44px' }} />
              </div>

              {/* Total preview */}
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem', borderRadius: '12px', backgroundColor: 'var(--accent-subtle)', border: '1.5px solid var(--accent-border)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginBottom: '0.25rem' }}>الإجمالي المتوقع</p>
                <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                  {(selectedCoach.baseSalary + (salaryForm.applyBonus
                    ? selectedCoach.baseSalary * selectedCoach.bonusRate
                    : parseFloat(salaryForm.bonusAmount || '0'))).toLocaleString()} ج
                </p>
              </div>

              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="submit" disabled={loading} style={{ ...btnNeon, minHeight: '44px', opacity: loading ? 0.6 : 1 }}>
                  <Banknote size={15} strokeWidth={2.5} />
                  {loading ? 'جاري الحفظ...' : 'صرف المرتب'}
                </button>
                <button type="button" onClick={() => setShowSalary(null)} style={{ ...btnSecondary, minHeight: '44px' }}>إلغاء</button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Coaches grid: 1 col mobile → 2 col md+ */}
      <div className="grid-2col">
        {coaches.length === 0 ? (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>لا يوجد مدربون بعد</p>
        ) : coaches.map(coach => (
          <Card key={coach.id}>
            <CardContent>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', paddingTop: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PersonStanding size={19} strokeWidth={2} color="var(--text-on-volt)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coach.name}</p>
                    {coach.phone && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{coach.phone}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button onClick={() => startEdit(coach)}
                    style={{ ...btnSecondary, padding: '0.4rem 0.65rem', fontSize: '0.75rem', minHeight: '36px' }}>
                    <Pencil size={12} strokeWidth={2} />
                  </button>
                  <button onClick={() => setShowSalary(coach.id)}
                    style={{ ...btnNeon, padding: '0.4rem 0.75rem', fontSize: '0.75rem', minHeight: '36px' }}>
                    <Banknote size={12} strokeWidth={2.5} />
                    مرتب
                  </button>
                </div>
              </div>

              {/* Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: 'var(--accent)' }}>
                  <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', marginBottom: '0.2rem' }}>الراتب الأساسي</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-on-volt)', fontVariantNumeric: 'tabular-nums' }}>{coach.baseSalary.toLocaleString()} ج</p>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--accent)', marginBottom: '0.2rem' }}>نسبة البونص</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent)' }}>{(coach.bonusRate * 100).toFixed(0)}%</p>
                    <Award size={12} color="var(--accent)" strokeWidth={2} />
                  </div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>= {(coach.baseSalary * coach.bonusRate).toLocaleString()} ج</p>
                </div>
              </div>

              {/* Recent salaries */}
              {coach.salaries.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>آخر المرتبات</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {coach.salaries.slice(0, 2).map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-surface)' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{MONTHS[s.month - 1]} {s.year}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{s.totalPaid.toLocaleString()} ج</span>
                          <Badge variant={s.paid ? 'neon' : 'warning'}>{s.paid ? 'مصروف' : 'معلق'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
