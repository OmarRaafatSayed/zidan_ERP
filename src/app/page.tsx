'use client'
import { useEffect, useState } from 'react'
import {
  Users, ClipboardList, Banknote, TrendingUp, TrendingDown,
  ShoppingBag, Eye, Building2, Target,
  ArrowUpRight, ArrowDownRight, Wallet, UserCheck,
  RefreshCw, Megaphone, UserPlus, BarChart2, PieChart,
  Receipt,
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import type { MonthlyReport } from '@/lib/reportMetrics'

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface Stats {
  month: number; year: number
  branchStats: { id: number; name: string; year: string | null; activeSubscriptions: number }[]
  totalPlayers: number
  subscriptionIncome: number; totalSubscriptions: number
  sideIncomeTotal: number; totalIncome: number
  expensesBreakdown: { id: number; name: string; percentage: number | null; fixedAmount: number | null; calculatedAmount: number }[]
  totalExpenses: number
  salaries: { id: number; coach: { name: string }; baseSalary: number; bonusAmount: number; totalPaid: number }[]
  totalSalaries: number; netProfit: number
  visitors: { total: number; converted: number; conversionRate: string }
  goals: { branchId: number; branchName: string; target: number; achieved: number; gap: number; pct: string }[]
  report: MonthlyReport
}

type DashTab = 'overview' | 'report' | 'finance' | 'branches'

const TAB_CONFIG: { key: DashTab; label: string; icon: typeof BarChart2 }[] = [
  { key: 'overview', label: 'نظرة عامة', icon: BarChart2 },
  { key: 'report',   label: 'التقرير',   icon: PieChart  },
  { key: 'finance',  label: 'المالية',   icon: Banknote  },
  { key: 'branches', label: 'الفروع',    icon: Building2 },
]

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                 'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

/* ─────────────────────────────────────────────────────────────
   Dashboard root
───────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [month,   setMonth]   = useState(1)
  const [year,    setYear]    = useState(2025)
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<DashTab>('overview')

  useEffect(() => {
    const d = new Date()
    setMonth(d.getMonth() + 1)
    setYear(d.getFullYear())
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/stats?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month, year])

  return (
    <div className="animate-fade-in" dir="rtl"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      <PageHeader
        title="لوحة التحكم"
        subtitle={`${MONTHS[month - 1]} ${year} · نظرة عامة على أداء الأكاديمية`}
        month={month} year={year}
        onMonthChange={setMonth} onYearChange={setYear}
      />

      {/* ── Tab strip ── */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{
          display: 'inline-flex', gap: '4px', padding: '4px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '14px', minWidth: 'max-content',
        }}>
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => {
            const active = tab === key
            return (
              <button key={key} onClick={() => setTab(key)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '10px',
                fontSize: '0.84rem', fontWeight: 700,
                border: 'none', cursor: 'pointer', minHeight: '40px',
                backgroundColor: active ? 'var(--accent)' : 'transparent',
                color: active ? 'var(--text-on-volt)' : 'var(--text-secondary)',
                transition: 'background-color 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}>
                <Icon size={13} strokeWidth={2.5} />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <TabSkeleton />
      ) : !stats ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          تعذر تحميل البيانات
        </div>
      ) : (
        <>
          {tab === 'overview' && <OverviewTab  stats={stats} />}
          {tab === 'report'   && <ReportTab    stats={stats} />}
          {tab === 'finance'  && <FinanceTab   stats={stats} />}
          {tab === 'branches' && <BranchesTab  stats={stats} />}
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 1 — نظرة عامة
   أهم 8 أرقام + الأهداف
══════════════════════════════════════════════════════════════ */
function OverviewTab({ stats }: { stats: Stats }) {
  const r = stats.report
  /* إجمالي المصاريف = كل البنود + الرواتب */
  const totalAllExpenses = r.expenses.total

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── صف 1: الإيرادات الكاملة ── */}
      <Section label="الإيرادات الشهرية">
        <div className="grid-kpi">
          <StatCard
            title="إيرادات الاشتراكات"
            value={`${r.incomeFromSubscription.toLocaleString()} ج`}
            icon={Banknote} color="blue"
          />
          <StatCard
            title="إيرادات جانبية"
            value={`${r.otherRevenues.toLocaleString()} ج`}
            icon={ShoppingBag} color="muted"
            subtitle="بيع منتجات / أخرى"
          />
          <StatCard
            title="إجمالي الدخل"
            value={`${r.totalIncome.toLocaleString()} ج`}
            icon={Wallet} color="yellow"
            subtitle="اشتراكات + جانبي"
          />
          <StatCard
            title="صافي الربح"
            value={`${r.netProfit.toLocaleString()} ج`}
            icon={r.netProfit >= 0 ? TrendingUp : TrendingDown}
            color={r.netProfit >= 0 ? 'green' : 'red'}
            trend={r.netProfit >= 0
              ? { label: 'ربح', positive: true }
              : { label: 'خسارة', positive: false }}
          />
        </div>
      </Section>

      {/* ── صف 2: المصاريف والأعضاء ── */}
      <Section label="المصاريف والأعضاء">
        <div className="grid-kpi">
          <StatCard
            title="إجمالي المصاريف"
            value={`${totalAllExpenses.toLocaleString()} ج`}
            icon={TrendingDown} color="red"
            subtitle="بنود + رواتب"
          />
          <StatCard
            title="رواتب المدربين"
            value={`${r.expenses.salaries.toLocaleString()} ج`}
            icon={Users} color="muted"
          />
          <StatCard
            title="إجمالي اللاعبين"
            value={r.playersCount}
            icon={Users} color="blue"
          />
          <StatCard
            title="اشتراكات الشهر"
            value={stats.totalSubscriptions}
            icon={ClipboardList} color="muted"
            subtitle="اشتراك مسجل"
          />
        </div>
      </Section>

      {/* ── صف 3: الزيارات والاحتفاظ ── */}
      <Section label="الزيارات والاحتفاظ">
        <div className="grid-kpi">
          <StatCard
            title="إجمالي الزوار"
            value={stats.visitors.total}
            icon={Eye} color="muted"
            subtitle={`تحويل ${stats.visitors.conversionRate}%`}
          />
          <StatCard
            title="تحولوا لاشتراكات"
            value={stats.visitors.converted}
            icon={UserCheck} color="green"
            subtitle={`من ${stats.visitors.total} زيارة`}
          />
          <StatCard
            title="الاحتفاظ بالأعضاء"
            value={`${r.customerRetention.percentage}%`}
            icon={RefreshCw} color="green"
            subtitle={`${r.customerRetention.renewedCount} من ${r.customerRetention.previousMonthCount}`}
          />
          <StatCard
            title="عملاء جدد"
            value={r.customerAcquisition}
            icon={UserPlus} color="blue"
            subtitle={`${r.acquisitionFromVisits.percentage}% من الزيارات`}
          />
        </div>
      </Section>

      {/* ── الأهداف ── */}
      <Section label="الأهداف الشهرية">
        <GoalsGrid goals={stats.goals} />
      </Section>

    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — التقرير الشهري
   كل الأرقام بالتفصيل + جدول المصروفات الكامل
══════════════════════════════════════════════════════════════ */
function ReportTab({ stats }: { stats: Stats }) {
  const r = stats.report

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── الإيرادات ── */}
      <Section label="الإيرادات الشهرية">
        <div className="grid-kpi">
          <StatCard title="إيرادات الاشتراكات" value={`${r.incomeFromSubscription.toLocaleString()} ج`} icon={Banknote}    color="blue"   />
          <StatCard title="إيرادات جانبية (أخرى)" value={`${r.otherRevenues.toLocaleString()} ج`}       icon={ShoppingBag} color="muted"  />
          <StatCard title="إجمالي الدخل"        value={`${r.totalIncome.toLocaleString()} ج`}            icon={Wallet}      color="yellow" subtitle="اشتراكات + جانبي" />
          <StatCard title="صافي الربح"           value={`${r.netProfit.toLocaleString()} ج`}
            icon={r.netProfit >= 0 ? TrendingUp : TrendingDown}
            color={r.netProfit >= 0 ? 'green' : 'red'}
            trend={r.netProfit >= 0 ? { label: 'ربح', positive: true } : { label: 'خسارة', positive: false }} />
        </div>
      </Section>

      {/* ── تفاصيل المصروفات ── */}
      <Section label="تفاصيل المصروفات الشهرية">
        <ExpenseBreakdownPanel report={r} expensesBreakdown={stats.expensesBreakdown} />
      </Section>

      {/* ── اللاعبون والاحتفاظ ── */}
      <Section label="اللاعبون والاحتفاظ">
        <div className="grid-kpi">
          <StatCard title="إجمالي اللاعبين"    value={r.playersCount}                              icon={Users}      color="blue"   />
          <StatCard title="الاحتفاظ بالأعضاء"  value={`${r.customerRetention.percentage}%`}
            icon={RefreshCw} color="green"
            subtitle={`${r.customerRetention.renewedCount} جدّد من ${r.customerRetention.previousMonthCount}`} />
          <StatCard title="عملاء جدد مكتسبون"  value={r.customerAcquisition}                       icon={UserPlus}   color="blue"   subtitle="تحولوا لاشتراكات" />
          <StatCard title="نسبة التحويل"        value={`${r.acquisitionFromVisits.percentage}%`}
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

    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — المالية
   الـ ledger الكامل + الرواتب
══════════════════════════════════════════════════════════════ */
function FinanceTab({ stats }: { stats: Stats }) {
  const r = stats.report
  const profitable = r.netProfit >= 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* KPI strip */}
      <div className="grid-kpi">
        <StatCard title="إجمالي الدخل"    value={`${r.totalIncome.toLocaleString()} ج`}         icon={Wallet}       color="yellow" subtitle="اشتراكات + جانبي" />
        <StatCard title="إجمالي المصاريف" value={`${r.expenses.total.toLocaleString()} ج`}       icon={TrendingDown} color="red"    subtitle="بنود + رواتب مدربين" />
        <StatCard title="صافي الربح"      value={`${r.netProfit.toLocaleString()} ج`}
          icon={profitable ? TrendingUp : TrendingDown}
          color={profitable ? 'green' : 'red'}
          trend={profitable ? { label: 'ربح', positive: true } : { label: 'خسارة', positive: false }} />
        <StatCard title="رواتب المدربين"  value={`${r.expenses.salaries.toLocaleString()} ج`}   icon={Users}        color="muted" />
      </div>

      <div className="grid-2col">

        {/* ── Ledger كامل ── */}
        <PanelCard icon={Receipt} title="ملخص الحسابات">

          {/* الإيرادات */}
          <LedgerGroup label="الإيرادات" />
          <LedgerRow
            label="إيرادات الاشتراكات"
            value={`${r.incomeFromSubscription.toLocaleString()} ج`}
            type="income" note="الأساس"
          />
          {r.otherRevenues > 0 && (
            <LedgerRow
              label="إيرادات جانبية / أخرى"
              value={`${r.otherRevenues.toLocaleString()} ج`}
              type="income"
            />
          )}
          <LedgerRow
            label="إجمالي الدخل"
            value={`${r.totalIncome.toLocaleString()} ج`}
            type="income" bold
          />

          <Spacer />

          {/* المصروفات — البنود من الداتابيز */}
          <LedgerGroup label="المصاريف" />

          {/* الملعب / الإيجار */}
          {r.expenses.field > 0 && (
            <LedgerRow label="الملعب / الإيجار" value={`${r.expenses.field.toLocaleString()} ج`}     type="expense" />
          )}
          {/* الأدوات */}
          {r.expenses.tools > 0 && (
            <LedgerRow label="الأدوات والمعدات" value={`${r.expenses.tools.toLocaleString()} ج`}     type="expense" />
          )}
          {/* الاجتماعات */}
          {r.expenses.meetings > 0 && (
            <LedgerRow label="الاجتماعات والسفر" value={`${r.expenses.meetings.toLocaleString()} ج`} type="expense" />
          )}
          {/* التسويق */}
          {r.expenses.marketing > 0 && (
            <LedgerRow label="التسويق والإعلانات" value={`${r.expenses.marketing.toLocaleString()} ج`} type="expense" />
          )}
          {/* بنود أخرى */}
          {r.expenses.other > 0 && (
            <LedgerRow label="بنود أخرى" value={`${r.expenses.other.toLocaleString()} ج`}             type="expense" />
          )}
          {/* إن ما كانش في أي بند مصنّف، اعرض البنود الخام */}
          {r.expenses.field === 0 && r.expenses.tools === 0 && r.expenses.meetings === 0 &&
           r.expenses.marketing === 0 && r.expenses.other === 0 &&
           stats.expensesBreakdown.length > 0 &&
            stats.expensesBreakdown.map(e => (
              <LedgerRow
                key={e.id} label={e.name}
                value={`${e.calculatedAmount.toLocaleString()} ج`}
                type="expense"
                note={e.percentage ? `${e.percentage}%` : undefined}
              />
            ))
          }
          {/* الرواتب دايماً من CoachSalary */}
          {r.expenses.salaries > 0 && (
            <LedgerRow label="رواتب المدربين" value={`${r.expenses.salaries.toLocaleString()} ج`}     type="expense" />
          )}

          {r.expenses.total === 0 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>لا توجد مصاريف مسجلة</p>
          )}

          {/* إجمالي المصاريف */}
          <LedgerRow
            label="إجمالي المصاريف"
            value={`${r.expenses.total.toLocaleString()} ج`}
            type="expense" bold
          />

          {/* صافي الربح */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: '0.75rem', marginTop: '1rem', padding: '0.875rem 1rem',
            borderRadius: '12px',
            backgroundColor: profitable ? 'var(--accent)' : 'var(--accent-subtle)',
            border: profitable ? 'none' : '1.5px solid var(--accent-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {profitable
                ? <TrendingUp  size={16} strokeWidth={2.5} color="var(--neon)" />
                : <TrendingDown size={16} strokeWidth={2.5} color="var(--text-on-volt)" />}
              <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-on-volt)' }}>صافي الربح</span>
            </div>
            <span style={{
              fontWeight: 900, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums',
              color: profitable ? 'var(--neon)' : 'var(--text-on-volt)',
            }}>
              {r.netProfit.toLocaleString()} ج
            </span>
          </div>
        </PanelCard>

        {/* ── الرواتب ── */}
        <PanelCard icon={Users} title="مرتبات المدربين"
          accessory={r.expenses.salaries > 0
            ? <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                {r.expenses.salaries.toLocaleString()} ج
              </span>
            : undefined}
        >
          {stats.salaries.length === 0 ? (
            <EmptyState icon={Users} label="لا توجد مرتبات هذا الشهر" hint="اذهب لصفحة المدربين لصرف المرتبات" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stats.salaries.map((s, idx) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.875rem 1rem', borderRadius: '12px',
                  backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
                }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    backgroundColor: 'var(--accent)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-on-volt)',
                  }}>
                    {s.coach.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.coach.name}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px', fontVariantNumeric: 'tabular-nums' }}>
                      أساسي {s.baseSalary.toLocaleString()} ج
                      {s.bonusAmount > 0 && (
                        <span style={{ color: 'var(--accent)', marginRight: '0.3rem' }}>
                          + بونص {s.bonusAmount.toLocaleString()} ج
                        </span>
                      )}
                    </p>
                  </div>
                  <span style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {s.totalPaid.toLocaleString()} ج
                  </span>
                </div>
              ))}
              {/* Total */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 1rem', borderRadius: '10px',
                backgroundColor: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
                marginTop: '0.25rem',
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>إجمالي الرواتب</span>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                  {r.expenses.salaries.toLocaleString()} ج
                </span>
              </div>
            </div>
          )}
        </PanelCard>

      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 4 — الفروع
══════════════════════════════════════════════════════════════ */
function BranchesTab({ stats }: { stats: Stats }) {
  const totalActive = stats.branchStats.reduce((s, b) => s + b.activeSubscriptions, 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <div className="grid-kpi">
        <StatCard title="المشتركون النشطون" value={totalActive}              icon={Users}        color="blue"  />
        <StatCard title="عدد الفروع"         value={stats.branchStats.length} icon={Building2}    color="muted" />
        <StatCard title="اشتراكات الشهر"    value={stats.totalSubscriptions}  icon={ClipboardList} color="muted" />
        <StatCard title="إجمالي اللاعبين"   value={stats.totalPlayers}        icon={Users}        color="yellow" />
      </div>

      <Section label="تفاصيل الفروع">
        {stats.branchStats.length === 0 ? (
          <EmptyState icon={Building2} label="لا توجد فروع بعد" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.branchStats
              .slice()
              .sort((a, b) => b.activeSubscriptions - a.activeSubscriptions)
              .map((b, idx) => {
                const pct   = totalActive > 0 ? (b.activeSubscriptions / totalActive) * 100 : 0
                const isTop = idx === 0
                return (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.875rem 1rem', borderRadius: '14px',
                    backgroundColor: isTop ? 'var(--accent)' : 'var(--bg-surface)',
                    border: isTop ? 'none' : '1px solid var(--border-default)',
                  }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                      backgroundColor: isTop ? 'rgba(255,255,255,0.15)' : 'var(--bg-surface-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 900,
                      color: isTop ? '#fff' : 'var(--text-muted)',
                    }}>{idx + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 800, fontSize: '0.9rem', color: isTop ? '#fff' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.3rem' }}>
                        {b.name}
                      </p>
                      <div style={{ backgroundColor: isTop ? 'rgba(255,255,255,0.2)' : 'var(--progress-track)', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '99px', backgroundColor: isTop ? 'var(--neon)' : 'var(--accent)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', flexShrink: 0 }}>
                      <p style={{ fontSize: '1.6rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: isTop ? 'var(--neon)' : 'var(--text-primary)' }}>
                        {b.activeSubscriptions}
                      </p>
                      <p style={{ fontSize: '0.68rem', color: isTop ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)', textAlign: 'left' }}>{pct.toFixed(0)}%</p>
                    </div>
                  </div>
                )
              })}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.625rem 1rem', borderRadius: '10px',
              backgroundColor: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>إجمالي المشتركين النشطين</span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{totalActive}</span>
            </div>
          </div>
        )}
      </Section>

      <Section label="الأهداف الشهرية">
        <GoalsGrid goals={stats.goals} />
      </Section>

    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Expense Breakdown Panel — تاب التقرير
   يعرض البنود الكاملة بغض النظر عن التصنيف
══════════════════════════════════════════════════════════════ */
function ExpenseBreakdownPanel({
  report: r,
  expensesBreakdown,
}: {
  report: MonthlyReport
  expensesBreakdown: Stats['expensesBreakdown']
}) {
  /* نبني جدول الصفوف: البنود المصنّفة (من reportMetrics) + الرواتب */
  const categoryRows: { label: string; amount: number; tag?: string }[] = [
    { label: 'الملعب / الإيجار',    amount: r.expenses.field,     tag: 'field'     },
    { label: 'الأدوات والمعدات',    amount: r.expenses.tools,     tag: 'tools'     },
    { label: 'الاجتماعات والسفر',   amount: r.expenses.meetings,  tag: 'meetings'  },
    { label: 'التسويق والإعلانات',  amount: r.expenses.marketing, tag: 'marketing' },
    { label: 'بنود أخرى',           amount: r.expenses.other,     tag: 'other'     },
  ].filter(x => x.amount > 0)

  /* لو ما كانش في بنود مصنّفة خالص، هعرض البنود الخام من الداتابيز */
  const rawRows = categoryRows.length === 0
    ? expensesBreakdown.map(e => ({ label: e.name, amount: e.calculatedAmount, tag: 'raw' }))
    : []

  /* الرواتب دايماً صف مستقل */
  const salaryRow = r.expenses.salaries > 0
    ? [{ label: 'رواتب المدربين', amount: r.expenses.salaries, tag: 'salaries' }]
    : []

  const allRows = [...categoryRows, ...rawRows, ...salaryRow]
  const grandTotal = r.expenses.total /* = totalIncome - netProfit */

  if (allRows.length === 0) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-surface)', borderRadius: '14px',
        padding: '1.5rem', border: '1px solid var(--border-default)',
      }}>
        <EmptyState icon={BarChart2} label="لا توجد مصاريف مسجلة هذا الشهر"
          hint="أضف بنود المصاريف من صفحة المالية" />
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border-accent)',
      borderRadius: '20px', overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '1rem 1.375rem', borderBottom: '1px solid var(--border-default)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Receipt size={15} strokeWidth={2.2} color="var(--text-on-volt)" />
          </div>
          <h3 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>توزيع المصروفات</h3>
        </div>
        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
          {grandTotal.toLocaleString()} ج إجمالي
        </span>
      </div>

      {/* ── Rows ── */}
      <div style={{ padding: '1rem 1.375rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {allRows.map((row, i) => {
          const pct = grandTotal > 0 ? (row.amount / grandTotal) * 100 : 0
          const isSalary = row.tag === 'salaries'
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '99px', flexShrink: 0,
                    backgroundColor: isSalary ? 'var(--neon-text)' : 'var(--accent)',
                  }} />
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
                <div style={{
                  height: '100%', borderRadius: '99px',
                  backgroundColor: isSalary ? 'var(--neon-text)' : 'var(--accent)',
                  width: `${pct}%`, transition: 'width 0.55s ease',
                }} />
              </div>
            </div>
          )
        })}

        {/* ── Formula strip ── */}
        <div style={{
          marginTop: '0.5rem', borderTop: '1.5px solid var(--border-default)', paddingTop: '0.875rem',
          display: 'flex', flexDirection: 'column', gap: '0.4rem',
        }}>
          <FormulaRow
            label="إجمالي الدخل"
            value={`${r.totalIncome.toLocaleString()} ج`}
            color="var(--accent)"
          />
          <FormulaRow
            label="− إجمالي المصاريف"
            value={`${grandTotal.toLocaleString()} ج`}
            color="var(--text-muted)"
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.75rem 1rem', borderRadius: '10px',
            backgroundColor: r.netProfit >= 0 ? 'var(--accent)' : 'var(--accent-subtle)',
            border: r.netProfit >= 0 ? 'none' : '1.5px solid var(--accent-border)',
            marginTop: '0.25rem',
          }}>
            <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-on-volt)' }}>
              = صافي الربح
            </span>
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

/* ═══════════════════════════════════════════════════════════
   Shared: Goals Grid
══════════════════════════════════════════════════════════════ */
function GoalsGrid({ goals }: { goals: Stats['goals'] }) {
  if (goals.length === 0) {
    return <EmptyState icon={Target} label="لم يتم تعيين أهداف بعد" hint="أضف هدفاً من صفحة المالية" />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {goals.map(g => {
        const pct  = Math.min(parseFloat(g.pct), 100)
        const done = pct >= 100
        const warn = pct < 30
        const barColor = done ? 'var(--neon)' : pct >= 60 ? 'var(--accent)' : 'var(--color-beam-fade)'
        return (
          <div key={g.branchId} style={{
            backgroundColor: 'var(--bg-surface)', borderRadius: '14px', padding: '1rem 1.125rem',
            border: done ? '1.5px solid var(--neon-border)' : '1.5px solid var(--border-default)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.branchName}
                </p>
                {!done && (
                  <p style={{ fontSize: '0.72rem', color: warn ? 'var(--status-danger-text)' : 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    {warn ? <ArrowDownRight size={11} strokeWidth={2.5} /> : <ArrowUpRight size={11} strokeWidth={2.5} />}
                    {g.gap > 0 ? `ناقص ${g.gap} مشترك` : 'الهدف محقق'}
                  </p>
                )}
              </div>
              <span style={{
                padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800,
                fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                backgroundColor: done ? 'var(--neon-subtle)' : 'var(--accent-subtle)',
                color: done ? 'var(--neon-text)' : 'var(--text-primary)',
                border: done ? '1px solid var(--neon-border)' : '1px solid var(--accent-border)',
              }}>
                {done ? '✓ ' : ''}{g.pct}%
              </span>
            </div>
            <div style={{ backgroundColor: 'var(--progress-track)', borderRadius: '99px', height: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ height: '100%', borderRadius: '99px', backgroundColor: barColor, width: `${pct}%`, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>الحالي</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.78rem', fontWeight: 700 }}>
                <span style={{ color: done ? 'var(--neon-text)' : 'var(--accent)', fontSize: '0.95rem', fontWeight: 900 }}>{g.achieved}</span>
                <span style={{ color: 'var(--text-disabled)', margin: '0 0.2rem' }}>/</span>
                <span style={{ color: 'var(--text-secondary)' }}>{g.target}</span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Primitives
══════════════════════════════════════════════════════════════ */
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

function PanelCard({ icon: Icon, title, accessory, children }: {
  icon: typeof Building2
  title: string
  accessory?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border-accent)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '1.125rem 1.375rem', borderBottom: '1px solid var(--border-default)', flexWrap: 'wrap', rowGap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={15} strokeWidth={2.2} color="var(--text-on-volt)" />
          </div>
          <h3 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</h3>
        </div>
        {accessory && <div>{accessory}</div>}
      </div>
      <div style={{ padding: '1.25rem 1.375rem', flex: 1 }}>{children}</div>
    </div>
  )
}

function LedgerGroup({ label }: { label: string }) {
  return (
    <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', paddingBottom: '0.4rem' }}>
      {label}
    </div>
  )
}

function LedgerRow({ label, value, type, note, bold }: {
  label: string; value: string; type: 'income' | 'expense'; note?: string; bold?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0', borderBottom: '1px solid var(--border-default)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '99px', backgroundColor: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: bold ? '0.875rem' : '0.84rem', color: bold ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: bold ? 800 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {note && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', padding: '0.1rem 0.35rem', flexShrink: 0 }}>{note}</span>}
      </div>
      <span style={{ fontWeight: bold ? 900 : 700, fontSize: bold ? '0.9rem' : '0.84rem', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', flexShrink: 0 }}>
        {type === 'expense' ? '− ' : ''}{value}
      </span>
    </div>
  )
}

function Spacer() { return <div style={{ height: '1rem' }} /> }

function EmptyState({ icon: Icon, label, hint }: { icon: typeof Building2; label: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem', gap: '0.5rem', textAlign: 'center' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}>
        <Icon size={20} strokeWidth={1.5} color="var(--text-disabled)" />
      </div>
      <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</p>
      {hint && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
}

function TabSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="skeleton" style={{ height: '12px', width: '120px', borderRadius: '6px' }} />
      <div className="grid-kpi">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '18px' }} />
        ))}
      </div>
      <div className="grid-kpi">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '18px' }} />
        ))}
      </div>
    </div>
  )
}
