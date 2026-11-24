'use client'
import { useState, useEffect } from 'react'
import { Wallet, TrendingDown, PlusCircle, ShoppingBag, Target, Trash2, Info, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import { inputStyle, labelStyle, btnPrimary, btnSecondary, btnNeon, calloutWarn, calloutInfo, progressTrack } from '@/lib/styles'
import ExportButtons from '@/components/ExportButtons'
import { fmt, fmtDate } from '@/lib/export'
import type { CsvSheet, PdfOptions } from '@/lib/export'

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

interface ExpenseItem { id: number; name: string; percentage: number | null; fixedAmount: number | null; isCore: boolean }
interface SideItem    { id: number; description: string; amount: number; date: string }
interface Branch      { id: number; name: string }
interface GoalItem    { id: number; branchId: number; branch: { name: string }; targetCount: number; month: number; year: number }
type Tab = 'expenses' | 'side' | 'goals'

export default function FinancePage() {
  // Lazy initialisers — evaluated client-side only, not during SSR render.
  const [month, setMonth]     = useState(1)
  const [year, setYear]       = useState(2025)
  const [expenses, setExpenses]   = useState<ExpenseItem[]>([])
  const [sideItems, setSideItems] = useState<SideItem[]>([])
  const [sideTotal, setSideTotal] = useState(0)
  const [goals, setGoals]         = useState<GoalItem[]>([])
  const [branches, setBranches]   = useState<Branch[]>([])
  const [subIncome, setSubIncome] = useState(0)
  const [loading, setLoading]     = useState(false)
  const [tab, setTab]             = useState<Tab>('expenses')
  const [expForm, setExpForm]   = useState({ name:'', percentage:'', fixedAmount:'', isCore:true })
  const [sideForm, setSideForm] = useState({ description:'', amount:'', date:'' })
  const [goalForm, setGoalForm] = useState({ branchId:'', targetCount:'' })

  useEffect(() => { fetch('/api/branches').then(r => r.json()).then(setBranches) }, [])
  useEffect(() => {
    const d = new Date()
    setMonth(d.getMonth() + 1)
    setYear(d.getFullYear())
  }, [])
  useEffect(() => { loadAll() }, [month, year])

  function loadAll() {
    fetch(`/api/expenses?month=${month}&year=${year}`).then(r => r.json()).then(setExpenses)
    fetch(`/api/side-income?month=${month}&year=${year}`).then(r => r.json()).then((d: { items: SideItem[]; total: number }) => { setSideItems(d.items); setSideTotal(d.total) })
    fetch(`/api/goals?month=${month}&year=${year}`).then(r => r.json()).then(setGoals)
    fetch(`/api/stats?month=${month}&year=${year}`).then(r => r.json()).then(d => setSubIncome(d.subscriptionIncome || 0))
  }

  async function addExpense(e: React.FormEvent) { e.preventDefault(); setLoading(true); await fetch('/api/expenses', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...expForm, month, year}) }); setExpForm({ name:'', percentage:'', fixedAmount:'', isCore:true }); setLoading(false); loadAll() }
  async function addSide(e: React.FormEvent)    { e.preventDefault(); setLoading(true); await fetch('/api/side-income', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...sideForm, month, year}) }); setSideForm({ description:'', amount:'', date:'' }); setLoading(false); loadAll() }
  async function addGoal(e: React.FormEvent)    { e.preventDefault(); setLoading(true); await fetch('/api/goals', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...goalForm, month, year}) }); setGoalForm({ branchId:'', targetCount:'' }); setLoading(false); loadAll() }
  async function delExpense(id: number) { await fetch(`/api/expenses?id=${id}`, { method:'DELETE' }); loadAll() }
  async function delSide(id: number)    { await fetch(`/api/side-income?id=${id}`, { method:'DELETE' }); loadAll() }

  const totalExpenses = expenses.reduce((s, e) => s + (e.percentage ? (subIncome * e.percentage) / 100 : (e.fixedAmount || 0)), 0)

  const tabs: { key: Tab; label: string; icon: typeof Wallet }[] = [
    { key:'expenses', label:'المصاريف',       icon: TrendingDown },
    { key:'side',     label:'إيرادات جانبية', icon: ShoppingBag  },
    { key:'goals',    label:'الأهداف',         icon: Target       },
  ]

  return (
    <div className="animate-fade-in" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <PageHeader title="الإدارة المالية" subtitle="المصاريف، الإيرادات الجانبية، والأهداف الشهرية"
        month={month} year={year} onMonthChange={setMonth} onYearChange={setYear}
        actions={
          <ExportButtons
            label="المالية"
            onCSV={() => ({
              sheets: [
                {
                  name: 'المصاريف',
                  headers: ['البند', 'النوع', 'المبلغ المحسوب (ج)'],
                  rows: expenses.map(e => [
                    e.name,
                    e.percentage ? `${e.percentage}% من الاشتراكات` : 'مبلغ ثابت',
                    fmt(e.percentage ? (subIncome * e.percentage) / 100 : (e.fixedAmount || 0)),
                  ]),
                } as CsvSheet,
                {
                  name: 'الإيرادات الجانبية',
                  headers: ['الوصف', 'المبلغ (ج)', 'التاريخ'],
                  rows: sideItems.map(s => [s.description, fmt(s.amount), fmtDate(s.date)]),
                } as CsvSheet,
              ],
              filename: `المالية-${MONTHS[month - 1]}-${year}`,
            })}
            onPDF={() => {
              const expRows = expenses.map((e, i) => {
                const amt = e.percentage ? (subIncome * e.percentage) / 100 : (e.fixedAmount || 0)
                return `<tr><td>${i+1}</td><td>${e.name}</td><td>${e.percentage ? e.percentage+'%' : 'ثابت'}</td><td class="amount">${fmt(amt)} ج</td></tr>`
              }).join('')
              const sideRows = sideItems.map((s, i) =>
                `<tr><td>${i+1}</td><td>${s.description}</td><td class="amount">${fmt(s.amount)} ج</td><td>${fmtDate(s.date)}</td></tr>`
              ).join('')
              const body = `
                <div class="pdf-section">
                  <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
                    <div class="kpi-card"><div class="kpi-label">إيرادات الاشتراكات</div><div class="kpi-value">${fmt(subIncome)} ج</div></div>
                    <div class="kpi-card"><div class="kpi-label">إيرادات جانبية</div><div class="kpi-value">${fmt(sideTotal)} ج</div></div>
                    <div class="kpi-card"><div class="kpi-label">إجمالي المصاريف</div><div class="kpi-value">${fmt(totalExpenses)} ج</div></div>
                  </div>
                </div>
                <div class="pdf-section">
                  <div class="pdf-section-title">بنود المصاريف</div>
                  <table>
                    <thead><tr><th>#</th><th>البند</th><th>النوع</th><th>المبلغ</th></tr></thead>
                    <tbody>${expRows || '<tr><td colspan="4">لا توجد بنود</td></tr>'}</tbody>
                    <tr class="total-row"><td colspan="3">الإجمالي</td><td>${fmt(totalExpenses)} ج</td></tr>
                  </table>
                </div>
                ${sideItems.length > 0 ? `
                <div class="pdf-section">
                  <div class="pdf-section-title">الإيرادات الجانبية</div>
                  <table>
                    <thead><tr><th>#</th><th>الوصف</th><th>المبلغ</th><th>التاريخ</th></tr></thead>
                    <tbody>${sideRows}</tbody>
                    <tr class="total-row"><td colspan="2">الإجمالي</td><td>${fmt(sideTotal)} ج</td><td></td></tr>
                  </table>
                </div>` : ''}
              `
              return { title: 'الإدارة المالية', subtitle: `${MONTHS[month-1]} ${year}`, body } as PdfOptions
            }}
          />
        }
      />

      {/* KPIs */}
      <div className="grid-3col">
        <StatCard title="إيرادات الاشتراكات" value={`${subIncome.toLocaleString()} ج`}     icon={Wallet}       color="blue"   />
        <StatCard title="إيرادات جانبية"      value={`${sideTotal.toLocaleString()} ج`}     icon={ShoppingBag}  color="yellow" />
        <StatCard title="إجمالي المصاريف"      value={`${totalExpenses.toLocaleString()} ج`} icon={TrendingDown} color="red"    />
      </div>

      {/* Tabs — scrollable on narrow screens */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div className="tab-strip-bg" style={{ display: 'inline-flex', gap: '4px', padding: '4px', minWidth: 'max-content' }}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '9px',
                fontSize: '0.84rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                minHeight: '44px',
                backgroundColor: tab === key ? 'var(--accent)' : 'transparent',
                color: tab === key ? 'var(--text-on-volt)' : 'var(--text-secondary)',
                boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
                transition: 'background-color 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}>
              <Icon size={13} strokeWidth={2.5} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses tab */}
      {tab === 'expenses' && (
        <div className="grid-2col">
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={15} strokeWidth={2} style={{ color: 'var(--color-volt-blue)', flexShrink: 0 }} />
                <CardTitle>إضافة بند مصروف</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ ...calloutWarn, display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem' }}>
                <AlertCircle size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>المصاريف تُحسب من إيرادات الاشتراكات ({subIncome.toLocaleString()} ج) فقط</span>
              </div>
              <form onSubmit={addExpense} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>اسم البند</label>
                  <input required value={expForm.name} onChange={e => setExpForm({...expForm, name: e.target.value})}
                    style={{ ...inputStyle, minHeight: '44px' }} placeholder="مثال: إيجار، كهرباء..." />
                </div>
                <div className="form-grid" style={{ gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>نسبة مئوية (%)</label>
                    <input type="number" min="0" max="100" step="0.1" value={expForm.percentage}
                      onChange={e => setExpForm({...expForm, percentage: e.target.value, fixedAmount:''})}
                      style={{ ...inputStyle, minHeight: '44px' }} placeholder="20" inputMode="decimal" />
                    {expForm.percentage && (
                      <p style={{ fontSize:'0.72rem', color:'var(--color-volt-blue)', marginTop:'0.2rem', fontVariantNumeric:'tabular-nums', fontWeight:700 }}>
                        = {((subIncome * parseFloat(expForm.percentage)) / 100).toLocaleString()} ج
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>مبلغ ثابت (ج)</label>
                    <input type="number" min="0" value={expForm.fixedAmount}
                      onChange={e => setExpForm({...expForm, fixedAmount: e.target.value, percentage:''})}
                      style={{ ...inputStyle, minHeight: '44px' }} placeholder="0" inputMode="numeric" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  style={{ ...btnPrimary, width: '100%', minHeight: '44px', opacity: loading ? 0.6 : 1 }}>
                  <PlusCircle size={14} strokeWidth={2.5} />
                  {loading ? 'جاري الإضافة...' : 'إضافة البند'}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>بنود المصاريف</CardTitle></CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p style={{ textAlign:'center', padding:'2rem 0', fontSize:'0.84rem', color:'var(--text-muted)' }}>لا توجد بنود مصاريف</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                  {expenses.map(e => {
                    const amount = e.percentage ? (subIncome * e.percentage) / 100 : (e.fixedAmount || 0)
                    return (
                      <div key={e.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.5rem', padding:'0.75rem 0.875rem', borderRadius:'10px', backgroundColor:'var(--bg-surface)' }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.name}</p>
                          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'1px' }}>
                            {e.percentage ? `${e.percentage}% من الاشتراكات` : 'مبلغ ثابت'}
                          </p>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexShrink: 0 }}>
                          <span style={{ fontWeight:800, fontSize:'0.95rem', color:'var(--accent)', fontVariantNumeric:'tabular-nums' }}>{amount.toLocaleString()} ج</span>
                          <button onClick={() => delExpense(e.id)}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--destructive)', display:'flex', padding:'4px', minHeight:'36px', minWidth:'36px', alignItems:'center', justifyContent:'center', borderRadius:'6px' }}
                            onMouseEnter={el => (el.currentTarget.style.color = 'var(--destructive-hover)')}
                            onMouseLeave={el => (el.currentTarget.style.color = 'var(--destructive)')}>
                            <Trash2 size={14} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'0.75rem', borderTop:'1.5px solid var(--border-default)', fontWeight:800, fontSize:'0.875rem' }}>
                    <span style={{ color:'var(--text-primary)' }}>الإجمالي</span>
                    <span style={{ color:'var(--accent)', fontVariantNumeric:'tabular-nums' }}>{totalExpenses.toLocaleString()} ج</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Side Income tab */}
      {tab === 'side' && (
        <div className="grid-2col">
          <Card>
            <CardHeader>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <ShoppingBag size={15} strokeWidth={2} style={{ color:'var(--color-volt-blue)', flexShrink: 0 }} />
                <CardTitle>إضافة إيراد جانبي</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ ...calloutInfo, display:'flex', alignItems:'flex-start', gap:'0.5rem', marginBottom:'1rem' }}>
                <Info size={14} strokeWidth={2} style={{ flexShrink:0, marginTop:'1px' }} />
                <span>الإيرادات الجانبية تُضاف للدخل العام ولا تؤثر على حسابات النسب</span>
              </div>
              <form onSubmit={addSide} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                <div>
                  <label style={labelStyle}>الوصف</label>
                  <input required value={sideForm.description} onChange={e => setSideForm({...sideForm, description: e.target.value})}
                    style={{ ...inputStyle, minHeight: '44px' }} placeholder="مثال: بيع شنط، تست، كامب..." />
                </div>
                <div>
                  <label style={labelStyle}>المبلغ (ج)</label>
                  <input required type="number" min="0" value={sideForm.amount} onChange={e => setSideForm({...sideForm, amount: e.target.value})}
                    style={{ ...inputStyle, minHeight: '44px' }} placeholder="0" inputMode="numeric" />
                </div>
                <div>
                  <label style={labelStyle}>التاريخ</label>
                  <input type="date" value={sideForm.date} onChange={e => setSideForm({...sideForm, date: e.target.value})}
                    style={{ ...inputStyle, minHeight: '44px' }} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ ...btnNeon, width:'100%', minHeight:'44px', opacity: loading ? 0.6 : 1 }}>
                  <PlusCircle size={14} strokeWidth={2.5} />
                  {loading ? 'جاري الإضافة...' : 'إضافة إيراد'}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.5rem', flexWrap:'wrap' }}>
                <CardTitle>الإيرادات الجانبية</CardTitle>
                <span style={{ fontWeight:900, fontSize:'0.95rem', color:'var(--color-volt-blue)', fontVariantNumeric:'tabular-nums', flexShrink: 0 }}>{sideTotal.toLocaleString()} ج</span>
              </div>
            </CardHeader>
            <CardContent>
              {sideItems.length === 0 ? (
                <p style={{ textAlign:'center', padding:'2rem 0', fontSize:'0.84rem', color:'var(--text-muted)' }}>لا توجد إيرادات جانبية</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                  {sideItems.map(s => (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.5rem', padding:'0.75rem 0.875rem', borderRadius:'10px', backgroundColor:'var(--bg-surface)' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.description}</p>
                        <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'1px' }}>{new Date(s.date).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexShrink: 0 }}>
                        <span style={{ fontWeight:800, color:'var(--accent)', fontVariantNumeric:'tabular-nums' }}>{s.amount.toLocaleString()} ج</span>
                        <button onClick={() => delSide(s.id)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--destructive)', display:'flex', padding:'4px', minHeight:'36px', minWidth:'36px', alignItems:'center', justifyContent:'center', borderRadius:'6px' }}
                          onMouseEnter={el => (el.currentTarget.style.color = 'var(--destructive-hover)')}
                          onMouseLeave={el => (el.currentTarget.style.color = 'var(--destructive)')}>
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals tab */}
      {tab === 'goals' && (
        <div className="grid-2col">
          <Card>
            <CardHeader>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <Target size={15} strokeWidth={2} style={{ color:'var(--color-volt-blue)', flexShrink: 0 }} />
                <CardTitle>تعيين هدف شهري</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={addGoal} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                <div>
                  <label style={labelStyle}>الفرع</label>
                  <select required value={goalForm.branchId} onChange={e => setGoalForm({...goalForm, branchId: e.target.value})}
                    style={{ ...inputStyle, minHeight: '44px' }}>
                    <option value="">اختر الفرع...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>عدد اللاعبين المستهدف</label>
                  <input required type="number" min="1" value={goalForm.targetCount}
                    onChange={e => setGoalForm({...goalForm, targetCount: e.target.value})}
                    style={{ ...inputStyle, minHeight: '44px' }} placeholder="50" inputMode="numeric" />
                </div>
                <button type="submit" disabled={loading}
                  style={{ ...btnNeon, width:'100%', minHeight:'44px', opacity: loading ? 0.6 : 1 }}>
                  <Target size={14} strokeWidth={2.5} />
                  {loading ? 'جاري الحفظ...' : 'حفظ الهدف'}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الأهداف المحددة</CardTitle></CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <p style={{ textAlign:'center', padding:'2rem 0', fontSize:'0.84rem', color:'var(--text-muted)' }}>لم يتم تحديد أهداف لهذا الشهر</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                  {goals.map(g => (
                    <div key={g.id} style={{ padding:'1rem', borderRadius:'12px', backgroundColor:'var(--accent-subtle)', border:'1.5px solid var(--accent-border)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.75rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight:800, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.branch.name}</p>
                          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'2px' }}>{MONTHS[g.month - 1]} {g.year}</p>
                        </div>
                        <span style={{ fontSize:'2rem', fontWeight:900, color:'var(--accent)', fontVariantNumeric:'tabular-nums', lineHeight:1, flexShrink: 0 }}>{g.targetCount}</span>
                      </div>
                      <div style={{ ...progressTrack }}>
                        <div style={{ height:'100%', borderRadius:'99px', backgroundColor:'var(--accent)', width:'0%' }} />
                      </div>
                      <p style={{ fontSize:'0.68rem', marginTop:'0.3rem', color:'var(--text-muted)', textAlign:'left' }}>هدف الشهر</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
