/**
 * reportMetrics.ts
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for all Monthly Report calculations.
 * Every UI card, table, and API route must derive its numbers
 * from this module — no inline formulas elsewhere.
 *
 * All division operations guard against zero denominators.
 * All nullable/missing values are normalised to 0 before math.
 */

// ─────────────────────────────────────────────────────────────
// Raw data shapes (what the DB / API provides)
// ─────────────────────────────────────────────────────────────

export interface RawExpenseItem {
  id: number
  name: string
  percentage: number | null
  fixedAmount: number | null
  isCore: boolean
  month: number
  year: number
}

export interface RawSalaryItem {
  id: number
  coachId: number
  baseSalary: number
  bonusAmount: number
  totalPaid: number
  paid: boolean
  coach: { name: string }
}

export interface RawVisitor {
  id: number
  source: string | null
  converted: boolean
}

export interface RawSubscription {
  id: number
  playerId: number
  amount: number
  status: string
  createdAt: Date | string
}

// ─────────────────────────────────────────────────────────────
// Output shapes
// ─────────────────────────────────────────────────────────────

/** Expenses broken down by the five standard categories.
 *  Any ExpenseItem whose name contains the category keyword
 *  (case-insensitive) is bucketed there; the rest fall into
 *  "other" which still counts toward totalExpenses. */
export interface ExpensesBreakdown {
  /** إيجار / ملعب */
  field: number
  /** رواتب المدربين (from CoachSalary totals) */
  salaries: number
  /** أدوات / معدات */
  tools: number
  /** اجتماعات / سفريات */
  meetings: number
  /** تسويق / إعلانات */
  marketing: number
  /** anything else */
  other: number
  /** field + salaries + tools + meetings + marketing + other */
  total: number
  /** per-item detail for the ledger UI */
  items: Array<{
    id: number
    name: string
    amount: number
    percentage: number | null
    category: ExpenseCategory
  }>
}

export type ExpenseCategory =
  | 'field'
  | 'salaries'
  | 'tools'
  | 'meetings'
  | 'marketing'
  | 'other'

export interface RetentionMetric {
  /** Number of prev-month players who renewed this month */
  renewedCount: number
  /** Total distinct players active in the previous month */
  previousMonthCount: number
  /** renewedCount / previousMonthCount * 100, 0 when denominator is 0 */
  percentage: number
}

export interface AcquisitionFromVisits {
  /** Visitors who converted to subscriptions */
  acquiredFromVisits: number
  /** Total visits in period */
  visits: number
  /** acquiredFromVisits / visits * 100, 0 when visits === 0 */
  percentage: number
}

export interface ConversionFromCampaign {
  /** Visitors sourced from campaign/ads who converted */
  campaignConversions: number
  /** Total visitors sourced from campaign/ads */
  campaignBase: number
  /** campaignConversions / campaignBase * 100, 0 when base === 0 */
  percentage: number
  /** Raw count of campaign/ad visitors (messages proxy) */
  campaignVisits: number
}

export interface MonthlyReport {
  month: number
  year: number

  // ── Income ──────────────────────────────────────────────────
  /** Sum of all subscription payments created in the period */
  incomeFromSubscription: number
  /** Sum of SideIncome records for the period */
  otherRevenues: number
  /** incomeFromSubscription + otherRevenues */
  totalIncome: number

  // ── Players ─────────────────────────────────────────────────
  /** Total players with at least one non-cancelled subscription ever */
  playersCount: number

  // ── Retention ───────────────────────────────────────────────
  customerRetention: RetentionMetric

  // ── Visits & Acquisition ────────────────────────────────────
  /** All visitors recorded for the period */
  visits: number
  /** Visitors who converted to a subscription this period */
  customerAcquisition: number
  acquisitionFromVisits: AcquisitionFromVisits
  /** Visitors attributed to ads / campaigns */
  visitsFromAds: number
  conversionFromCampaign: ConversionFromCampaign

  // ── Expenses ────────────────────────────────────────────────
  expenses: ExpensesBreakdown

  // ── Profit ──────────────────────────────────────────────────
  /** totalIncome − expenses.total */
  netProfit: number
}

// ─────────────────────────────────────────────────────────────
// Keyword maps for expense categorisation
// ─────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  field:     ['ملعب', 'إيجار', 'ايجار', 'rent', 'field', 'أرضية', 'ارضية'],
  salaries:  ['راتب', 'رواتب', 'مرتب', 'مرتبات', 'salary', 'salaries'],
  tools:     ['أدوات', 'ادوات', 'معدات', 'عدة', 'tools', 'equipment'],
  meetings:  ['اجتماع', 'اجتماعات', 'سفر', 'رحلة', 'meeting', 'meetings', 'trip'],
  marketing: ['تسويق', 'إعلان', 'اعلان', 'دعاية', 'حملة', 'marketing', 'ads', 'campaign'],
  other:     [],
}

/** Campaign/ads source values in Visitor.source */
const AD_SOURCE_KEYWORDS = ['حملة', 'إعلان', 'اعلان', 'campaign', 'ads', 'تسويق']

function categorise(name: string): ExpenseCategory {
  const lower = name.toLowerCase()
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS) as [ExpenseCategory, string[]][]) {
    if (cat === 'other') continue
    if (kws.some(kw => lower.includes(kw.toLowerCase()))) return cat
  }
  return 'other'
}

function safeDiv(numerator: number, denominator: number): number {
  if (denominator === 0 || !isFinite(denominator)) return 0
  return (numerator / denominator) * 100
}

function coerce(v: number | null | undefined): number {
  return v ?? 0
}

// ─────────────────────────────────────────────────────────────
// Main calculation function
// ─────────────────────────────────────────────────────────────

export interface ReportInputs {
  month: number
  year: number

  /** Subscriptions created within the reporting month (non-cancelled) */
  currentMonthSubscriptions: RawSubscription[]

  /** All subscriptions created in the PREVIOUS month (non-cancelled),
   *  used as the retention denominator */
  previousMonthSubscriptions: RawSubscription[]

  /** Subscriptions created this month that belong to players who also
   *  had a subscription last month (the renewal set) */
  renewedPlayerIds: number[]

  /** Distinct player IDs with any subscription last month */
  previousMonthPlayerIds: number[]

  /** Total players registered (or with any subscription) in the system */
  playersCount: number

  /** Side income records for the period */
  sideIncomeTotal: number

  /** Expense items for the period */
  expenses: RawExpenseItem[]

  /** Coach salary totals for the period */
  salaries: RawSalaryItem[]

  /** Visitors recorded in the period */
  visitors: RawVisitor[]
}

export function computeMonthlyReport(inputs: ReportInputs): MonthlyReport {
  const {
    month, year,
    currentMonthSubscriptions,
    renewedPlayerIds,
    previousMonthPlayerIds,
    playersCount,
    sideIncomeTotal,
    expenses,
    salaries,
    visitors,
  } = inputs

  // ── Income ────────────────────────────────────────────────
  const incomeFromSubscription = currentMonthSubscriptions.reduce(
    (sum, s) => sum + coerce(s.amount), 0,
  )
  const otherRevenues = coerce(sideIncomeTotal)
  const totalIncome = incomeFromSubscription + otherRevenues

  // ── Retention ────────────────────────────────────────────
  const previousMonthCount = previousMonthPlayerIds.length
  const renewedCount = renewedPlayerIds.length
  const retentionPct = safeDiv(renewedCount, previousMonthCount)

  const customerRetention: RetentionMetric = {
    renewedCount,
    previousMonthCount,
    percentage: parseFloat(retentionPct.toFixed(1)),
  }

  // ── Visits ───────────────────────────────────────────────
  const visits = visitors.length
  const convertedVisitors = visitors.filter(v => v.converted)
  const customerAcquisition = convertedVisitors.length

  const acquisitionFromVisits: AcquisitionFromVisits = {
    acquiredFromVisits: customerAcquisition,
    visits,
    percentage: parseFloat(safeDiv(customerAcquisition, visits).toFixed(1)),
  }

  // ── Campaign / Ads ───────────────────────────────────────
  const campaignVisitors = visitors.filter(v =>
    v.source
      ? AD_SOURCE_KEYWORDS.some(kw =>
          v.source!.toLowerCase().includes(kw.toLowerCase()),
        )
      : false,
  )
  const visitsFromAds = campaignVisitors.length
  const campaignConversions = campaignVisitors.filter(v => v.converted).length

  const conversionFromCampaign: ConversionFromCampaign = {
    campaignConversions,
    campaignBase: visitsFromAds,
    percentage: parseFloat(safeDiv(campaignConversions, visitsFromAds).toFixed(1)),
    campaignVisits: visitsFromAds,
  }

  // ── Expenses ─────────────────────────────────────────────
  const totalSalaries = salaries.reduce((s, sal) => s + coerce(sal.totalPaid), 0)

  const expenseItems = expenses.map(e => {
    const amount = e.percentage != null
      ? (incomeFromSubscription * e.percentage) / 100
      : coerce(e.fixedAmount)
    return {
      id: e.id,
      name: e.name,
      amount,
      percentage: e.percentage ?? null,
      category: categorise(e.name),
    }
  })

  const sumByCategory = (cat: ExpenseCategory) =>
    expenseItems
      .filter(i => i.category === cat)
      .reduce((s, i) => s + i.amount, 0)

  const expensesBreakdown: ExpensesBreakdown = {
    field:     sumByCategory('field'),
    salaries:  totalSalaries,   // always from CoachSalary, not expense items
    tools:     sumByCategory('tools'),
    meetings:  sumByCategory('meetings'),
    marketing: sumByCategory('marketing'),
    other:     sumByCategory('other'),
    total:     0, // computed below
    items: expenseItems,
  }

  expensesBreakdown.total =
    expensesBreakdown.field +
    expensesBreakdown.salaries +
    expensesBreakdown.tools +
    expensesBreakdown.meetings +
    expensesBreakdown.marketing +
    expensesBreakdown.other

  // ── Net Profit ───────────────────────────────────────────
  const netProfit = totalIncome - expensesBreakdown.total

  return {
    month,
    year,
    incomeFromSubscription,
    otherRevenues,
    totalIncome,
    playersCount,
    customerRetention,
    visits,
    customerAcquisition,
    acquisitionFromVisits,
    visitsFromAds,
    conversionFromCampaign,
    expenses: expensesBreakdown,
    netProfit,
  }
}
