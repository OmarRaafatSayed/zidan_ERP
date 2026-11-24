'use client'
import { useEffect, useState } from 'react'
import {
  Banknote, ShoppingBag, Wallet, TrendingUp, TrendingDown,
  Users, Eye, UserCheck, RefreshCw, UserPlus, Megaphone,
  BarChart2, Receipt,
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import ExportButtons from '@/components/ExportButtons'
import type { MonthlyReport } from '@/lib/reportMetrics'
import type { CsvSheet, PdfOptions } from '@/lib/export'
import { fmt } from '@/lib/export'

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                 'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

interface StatsSlice {
  expensesBreakdown: { id: number; name: string; percentage: number | null; calculatedAmount: number }[]
  report: MonthlyReport
}

export default function ReportPage() {
  const [month,   setMonth]   = useState(1)
  const [year,    setYear]    = useState(2025)
  const [data,    setData]    = useState<StatsSlice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const d = new Date()
    setMonth(d.getMonth() + 1)
    setYear(d.getFullYear())
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/stats?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month, year])

  const r = data?.report
  const monthLabel = `${MONTHS[month - 1]} ${year}`

  /* ── CSV builder ── */
  function buildCSV(): { sheets: CsvSheet[]; filename: string } {
    if (!r) return { sheets: [], filename: 'report' }

    const expRows = [
      ['الملعب / الإيجار',    r.expenses.field],
      ['الأدوات والمعدات',    r.expenses.tools],
      ['الاجتماعات والسفر',   r.expenses.meetings],
      ['التسويق والإعلانات',  r.expenses.marketing],
      ['بنود أخرى',           r.expenses.other],
      ['رواتب المدربين',       r.expenses.salaries],
    ].filter(([, v]) => (v as number) > 0)

    const sheets: CsvSheet[] = [
      {
        name: 'الإيرادات',
        headers: ['البند', 'المبلغ (ج)'],
        rows: [
          ['إيرادات الاشتراكات', fmt(r.incomeFromSubscription)],
          ['إيرادات جانبية / أخرى', fmt(r.otherRevenues)],
          ['إجمالي الدخل', fmt(r.totalIncome)],
        ],
      },
      {
        name: 'المصروفات',
        headers: ['البند', 'المبلغ (ج)', 'النسبة %'],
        rows: [
          ...expRows.map(([label, amt]) => [
            label,
            fmt(amt as number),
            r.expenses.total > 0
              ? ((amt as number / r.expenses.total) * 100).toFixed(1) + '%'
              : '0%',
          ]),
          ['إجمالي المصروفات', fmt(r.expenses.total), '100%'],
          ['صافي الربح', fmt(r.netProfit), ''],
        ],
      },
      {
        name: 'اللاعبون والاحتفاظ',
        headers: ['المؤشر', 'القيمة'],
        rows: [
          ['إجمالي اللاعبين', r.playersCount],
          ['جدّدوا الاشتراك', r.customerRetention.renewedCount],
          ['كانوا مشتركين الشهر السابق', r.customerRetention.previousMonthCount],
          ['نسبة الاحتفاظ %', r.customerRetention.percentage + '%'],
          ['عملاء جدد مكتسبون', r.customerAcquisition],
          ['نسبة التحويل من الزيارات %', r.acquisitionFromVisits.percentage + '%'],
        ],
      },
      {
        name: 'الحملات والزيارات',
        headers: ['المؤشر', 'القيمة'],
        rows: [
          ['إجمالي الزيارات', r.visits],
          ['زيارات من إعلانات / حملات', r.visitsFromAds],
          ['زيارات أخرى', r.visits - r.visitsFromAds],
          ['تحويل الحملات %', r.conversionFromCampaign.percentage + '%'],
          ['تحولوا للاشتراك من الحملات', r.conversionFromCampaign.campaignConversions],
        ],
      },
    ]

    return { sheets, filename: `تقرير-${monthLabel}` }
  }

  /* ── PDF builder ── */
  function buildPDF(): PdfOptions {
    if (!r) return { title: 'التقرير الشهري', body: '' }

    const expRows = [
      ['الملعب / الإيجار',   r.expenses.field],
      ['الأدوات والمعدات',   r.expenses.tools],
      ['الاجتماعات والسفر',  r.expenses.meetings],
      ['التسويق والإعلانات', r.expenses.marketing],
      ['بنود أخرى',          r.expenses.other],
      ['رواتب المدربين',      r.expenses.salaries],
    ].filter(([, v]) => (v as number) > 0)

    const pct = (v: number) =>
      r.expenses.total > 0 ? ((v / r.expenses.total) * 100).toFixed(0) + '%' : '0%'

    const profitClass = r.netProfit >= 0 ? 'profit-positive' : 'profit-negative'

    const body = `
      <!-- KPIs -->
      <div class="pdf-section">
        <div class="pdf-section-title">الإيرادات الشهرية</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">إيرادات الاشتراكات</div>
            <div class="kpi-value">${fmt(r.incomeFromSubscription)} ج</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">إيرادات جانبية</div>
            <div class="kpi-value">${fmt(r.otherRevenues)} ج</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">إجمالي الدخل</div>
            <div class="kpi-value">${fmt(r.totalIncome)} ج</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">صافي الربح</div>
            <div class="kpi-value ${profitClass}">${fmt(r.netProfit)} ج</div>
          </div>
        </div>
      </div>

      <!-- Expenses table -->
      <div class="pdf-section">
        <div class="pdf-section-title">تفاصيل المصروفات</div>
        <table>
          <thead><tr>
            <th>البند</th><th>المبلغ (ج)</th><th>النسبة</th>
          </tr></thead>
          <tbody>
            ${expRows.map(([label, amt]) => `
              <tr>
                <td>${label}</td>
                <td class="amount">${fmt(amt as number)} ج</td>
                <td>${pct(amt as number)}</td>
              </tr>`).join('')}
            <tr class="total-row">
              <td>إجمالي المصروفات</td>
              <td>${fmt(r.expenses.total)} ج</td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
        <div class="formula-box" style="margin-top:8pt">
          <span class="label">صافي الربح = إجمالي الدخل − إجمالي المصروفات</span>
          <span class="value ${profitClass}">${fmt(r.netProfit)} ج</span>
        </div>
      </div>

      <!-- Retention & Acquisition -->
      <div class="pdf-section">
        <div class="pdf-section-title">اللاعبون والاحتفاظ</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">إجمالي اللاعبين</div>
            <div class="kpi-value">${r.playersCount}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">الاحتفاظ بالأعضاء</div>
            <div class="kpi-value">${r.customerRetention.percentage}%</div>
            <div class="kpi-sub">${r.customerRetention.renewedCount} من ${r.customerRetention.previousMonthCount}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">عملاء جدد مكتسبون</div>
            <div class="kpi-value">${r.customerAcquisition}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">نسبة التحويل</div>
            <div class="kpi-value">${r.acquisitionFromVisits.percentage}%</div>
            <div class="kpi-sub">${r.acquisitionFromVisits.acquiredFromVisits} من ${r.acquisitionFromVisits.visits} زيارة</div>
          </div>
        </div>
      </div>

      <!-- Campaigns -->
      <div class="pdf-section">
        <div class="pdf-section-title">الحملات والإعلانات</div>
        <table>
          <thead><tr><th>المؤشر</th><th>القيمة</th></tr></thead>
          <tbody>
            <tr><td>إجمالي الزيارات</td><td>${r.visits}</td></tr>
            <tr><td>زيارات من إعلانات / حملات</td><td>${r.visitsFromAds}</td></tr>
            <tr><td>زيارات أخرى (دعوة عضو / مباشر)</td><td>${r.visits - r.visitsFromAds}</td></tr>
            <tr><td>نسبة تحويل الحملات</td><td>${r.conversionFromCampaign.percentage}%</td></tr>
            <tr><td>تحولوا للاشتراك من الحملات</td><td>${r.conversionFromCampaign.campaignConversions}</td></tr>
          </tbody>
        </table>
      </div>
    `

    return {
      title: 'التقرير الشهري',
      subtitle: monthLabel,
      body,
    }
  }

  return (
    <div className="animate-fade-in" dir="rtl"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <PageHeader
        title="التقرير الشهري"
        subtitle={r ? `${monthLabel} · ملخص كامل للأداء` : monthLabel}
        month={month} year={year}
        onMonthChange={setMonth} onYearChange={setYear}
        actions={r ? <ExportButtons onCSV={buildCSV} onPDF={buildPDF} label="التقرير" /> : undefined}
      />

      {loading && <ReportSkeleton />}

      {!loading && !r && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          تعذر تحميل البيانات
        </div>
      )}

      {!loading && r && (
        <>
          {/* ── الإيرادات ── */}
          <Section label="الإيرادات الشهرية">
            <div className="grid-kpi">
              <StatCard title="إيرادات الاشتراكات"    value={`${r.incomeFromSubscription.toLocaleString()} ج`} icon={Banknote}    color="blue"   />
              <StatCard title="إيرادات جانبية / أخرى" value={`${r.otherRevenues.toLocaleString()} ج`}          icon={ShoppingBag} color="muted"  />
              <StatCard title="إجمالي الدخل"           value={`${r.totalIncome.toLocaleString()} ج`}             icon={Wallet}      color="yellow" subtitle="اشتراكات + جانبي" />
              <StatCard title="صافي الربح"              value={`${r.netProfit.toLocaleString()} ج`}
                icon={r.netProfit >= 0 ? TrendingUp : TrendingDown}
                color={r.netProfit >= 0 ? 'green' : 'red'}
                trend={r.netProfit >= 0 ? { label: 'ربح', positive: true } : { label: 'خسارة', positive: false }} />
            </div>
          </Section>

          {/* ── توزيع المصروفات ── */}
          <Section label="تفاصيل المصروفات الشهرية">
            <ExpenseBreakdownCard report={r} expensesBreakdown={data.expensesBreakdown} />
          </Section>

          {/* ── اللاعبون والاحتفاظ ── */}
          <Section label="اللاعبون والاحتفاظ">
            <div className="grid-kpi">
              <StatCard title="إجمالي اللاعبين"   value={r.playersCount}                               icon={Users}      color="blue"   />
              <StatCard title="الاحتفاظ بالأعضاء" value={`${r.customerRetention.percentage}%`}
                icon={RefreshCw} color="green"
                subtitle={`${r.customerRetention.renewedCount} جدّد من ${r.customerRetention.previousMonthCount}`} />
              <StatCard title="عملاء جدد مكتسبون" value={r.customerAcquisition}                        icon={UserPlus}   color="blue"   subtitle="تحولوا لاشتراكات" />
              <StatCard title="نسبة التحويل"       value={`${r.acquisitionFromVisits.percentage}%`}
                icon={UserCheck}
                color={r.acquisitionFromVisits.percentage >= 30 ? 'green' : 'muted'}
                subtitle={`${r.acquisitionFromVisits.acquiredFromVisits} من ${r.acquisitionFromVisits.visits} زيارة`} />
            </div>
          </Section>

          {/* ── الحملات والإعلانات ── */}
          <Section label="الحملات والإعلانات">
            <div className="grid-kpi">
              <StatCard title="إجمالي الزيارات"   value={r.visits}                                     icon={Eye}       color="muted"  />
              <StatCard title="زيارات من إعلانات" value={r.visitsFromAds}                              icon={Megaphone} color="yellow" subtitle="حملات تسويقية" />
              <StatCard title="تحويل الحملات"     value={`${r.conversionFromCampaign.percentage}%`}
                icon={BarChart2}
                color={r.conversionFromCampaign.percentage >= 20 ? 'green' : 'muted'}
                subtitle={`${r.conversionFromCampaign.campaignConversions} من ${r.conversionFromCampaign.campaignBase}`} />
              <StatCard title="زيارات أخرى"       value={r.visits - r.visitsFromAds}                   icon={Eye}       color="muted"  subtitle="دعوة عضو / مباشر" />
            </div>
          </Section>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Expense Breakdown Card
───────────────────────────────────────────── */
function ExpenseBreakdownCard({
  report: r,
  expensesBreakdown,
}: {
  report: MonthlyReport
  expensesBreakdown: StatsSlice['expensesBreakdown']
}) {
  type ExpRow = { label: string; amount: number; isSalary?: boolean }

  const categoryRows: ExpRow[] = [
    { label: 'الملعب / الإيجار',    amount: r.expenses.field     },
    { label: 'الأدوات والمعدات',    amount: r.expenses.tools     },
    { label: 'الاجتماعات والسفر',   amount: r.expenses.meetings  },
    { label: 'التسويق والإعلانات',  amount: r.expenses.marketing },
    { label: 'بنود أخرى',           amount: r.expenses.other     },
  ].filter(x => x.amount > 0)

  const rawRows: ExpRow[] = categoryRows.length === 0
    ? expensesBreakdown.map(e => ({ label: e.name, amount: e.calculatedAmount }))
    : []

  const salaryRow: ExpRow[] =
    r.expenses.salaries > 0
      ? [{ label: 'رواتب المدربين', amount: r.expenses.salaries, isSalary: true }]
      : []

  const allRows = [...categoryRows, ...rawRows, ...salaryRow]
  const grandTotal = r.expenses.total

  if (allRows.length === 0) {
    return (
      <div style={{
        padding: '2rem', borderRadius: '16px', textAlign: 'center',
        backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        color: 'var(--text-muted)', fontSize: '0.84rem',
      }}>
        لا توجد مصاريف مسجلة هذا الشهر — أضف بنوداً من صفحة المالية
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border-accent)',
      borderRadius: '20px', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.375rem', borderBottom: '1px solid var(--border-default)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt size={15} strokeWidth={2.2} color="var(--text-on-volt)" />
          </div>
          <h3 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>توزيع المصروفات</h3>
        </div>
        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
          {grandTotal.toLocaleString()} ج إجمالي
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '1.125rem 1.375rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

        {/* Progress bars */}
        {allRows.map((row, i) => {
          const pct = grandTotal > 0 ? (row.amount / grandTotal) * 100 : 0
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '99px', flexShrink: 0, backgroundColor: row.isSalary ? 'var(--neon-text)' : 'var(--accent)' }} />
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.label}
                  </span>
                </div>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {row.amount.toLocaleString()} ج
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginRight: '0.4rem' }}>
                    {pct.toFixed(0)}%
                  </span>
                </span>
              </div>
              <div style={{ backgroundColor: 'var(--progress-track)', borderRadius: '99px', height: '7px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '99px', backgroundColor: row.isSalary ? 'var(--neon-text)' : 'var(--accent)', width: `${pct}%`, transition: 'width 0.55s ease' }} />
              </div>
            </div>
          )
        })}

        {/* Formula */}
        <div style={{ marginTop: '0.5rem', borderTop: '1.5px solid var(--border-default)', paddingTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <FormulaRow label="إجمالي الدخل"      value={`${r.totalIncome.toLocaleString()} ج`}  color="var(--accent)" />
          <FormulaRow label="− إجمالي المصاريف" value={`${grandTotal.toLocaleString()} ج`}      color="var(--text-muted)" />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.75rem 1rem', borderRadius: '10px', marginTop: '0.25rem',
            backgroundColor: r.netProfit >= 0 ? 'var(--accent)' : 'var(--accent-subtle)',
            border: r.netProfit >= 0 ? 'none' : '1.5px solid var(--accent-border)',
          }}>
            <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-on-volt)' }}>= صافي الربح</span>
            <span style={{ fontWeight: 900, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums', color: r.netProfit >= 0 ? 'var(--neon)' : 'var(--text-on-volt)' }}>
              {r.netProfit.toLocaleString()} ج
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormulaRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '0.84rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color }}>{value}</span>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Section + Skeleton
───────────────────────────────────────────── */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ display: 'block', width: '3px', height: '14px', borderRadius: '99px', backgroundColor: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

function ReportSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="skeleton" style={{ height: '12px', width: '120px', borderRadius: '6px' }} />
          <div className="grid-kpi">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="skeleton" style={{ height: '110px', borderRadius: '18px' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
