/**
 * GET /api/stats?month=M&year=Y
 *
 * Legacy dashboard endpoint — kept for backward compatibility.
 * Net profit and visitor conversion now derive from reportMetrics.ts
 * so they stay in sync with the /api/report endpoint.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeMonthlyReport } from '@/lib/reportMetrics'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const now = new Date()
  const m = searchParams.get('month') ? parseInt(searchParams.get('month')!) : now.getMonth() + 1
  const y = searchParams.get('year')  ? parseInt(searchParams.get('year')!)  : now.getFullYear()

  const startDate = new Date(y, m - 1, 1)
  const endDate   = new Date(y, m, 0, 23, 59, 59, 999)

  // Previous month for retention
  const prevM = m === 1 ? 12 : m - 1
  const prevY = m === 1 ? y - 1 : y
  const startPrev = new Date(prevY, prevM - 1, 1)
  const endPrev   = new Date(prevY, prevM, 0, 23, 59, 59, 999)

  // ── Branch stats ─────────────────────────────────────────
  const branches = await prisma.branch.findMany({
    include: {
      subscriptions: { where: { status: 'active' } },
    },
  })
  const branchStats = branches.map(b => ({
    id: b.id,
    name: b.name,
    year: b.year,
    activeSubscriptions: b.subscriptions.length,
  }))

  // ── Subscriptions this month ──────────────────────────────
  const monthSubscriptions = await prisma.subscription.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status:    { not: 'cancelled' },
    },
    select: { id: true, playerId: true, amount: true, status: true, createdAt: true },
  })

  // ── Previous month subscriptions (retention) ─────────────
  const prevSubscriptions = await prisma.subscription.findMany({
    where: {
      createdAt: { gte: startPrev, lte: endPrev },
      status:    { not: 'cancelled' },
    },
    select: { playerId: true, amount: true, status: true, createdAt: true, id: true },
  })
  const prevPlayerIds  = [...new Set(prevSubscriptions.map(s => s.playerId))]
  const currPlayerSet  = new Set(monthSubscriptions.map(s => s.playerId))
  const renewedIds     = prevPlayerIds.filter(id => currPlayerSet.has(id))

  // ── Side income ──────────────────────────────────────────
  const sideIncomeData = await prisma.sideIncome.findMany({
    where: { month: m, year: y },
    select: { amount: true },
  })
  const sideIncomeTotal = sideIncomeData.reduce((s, i) => s + i.amount, 0)

  // ── Expenses ─────────────────────────────────────────────
  const expenses = await prisma.expenseItem.findMany({
    where: { month: m, year: y },
    select: { id: true, name: true, percentage: true, fixedAmount: true, isCore: true, month: true, year: true },
  })

  // ── Salaries ─────────────────────────────────────────────
  const salaries = await prisma.coachSalary.findMany({
    where: { month: m, year: y },
    include: { coach: true },
  })

  // ── Visitors ─────────────────────────────────────────────
  const visitors = await prisma.visitor.findMany({
    where: { visitDate: { gte: startDate, lte: endDate } },
    select: { id: true, source: true, converted: true },
  })

  // ── Monthly goals ─────────────────────────────────────────
  const goals = await prisma.monthlyGoal.findMany({
    where: { month: m, year: y },
    include: { branch: true },
  })

  const totalPlayers = await prisma.player.count()

  // ── Centralised calculation ──────────────────────────────
  const report = computeMonthlyReport({
    month: m,
    year:  y,
    currentMonthSubscriptions: monthSubscriptions,
    previousMonthSubscriptions: prevSubscriptions,
    renewedPlayerIds: renewedIds,
    previousMonthPlayerIds: prevPlayerIds,
    playersCount: totalPlayers,
    sideIncomeTotal,
    expenses,
    salaries: salaries.map(s => ({
      id: s.id,
      coachId: s.coachId,
      baseSalary: s.baseSalary,
      bonusAmount: s.bonusAmount,
      totalPaid: s.totalPaid,
      paid: s.paid,
      coach: { name: s.coach.name },
    })),
    visitors,
  })

  // ── Goals progress ───────────────────────────────────────
  const goalsData = goals.map(g => {
    const branchSubs = branchStats.find(b => b.id === g.branchId)
    const achieved   = branchSubs?.activeSubscriptions ?? 0
    return {
      branchId:   g.branchId,
      branchName: g.branch.name,
      target:     g.targetCount,
      achieved,
      gap: g.targetCount - achieved,
      pct: g.targetCount > 0 ? ((achieved / g.targetCount) * 100).toFixed(1) : '0',
    }
  })

  // ── Backward-compat response shape ──────────────────────
  // Keeps existing field names for the dashboard page while also
  // exposing the new report fields under a `report` key.
  return NextResponse.json({
    month: m,
    year:  y,
    branchStats,
    totalPlayers,

    // Income (old names kept)
    subscriptionIncome:  report.incomeFromSubscription,
    totalSubscriptions:  monthSubscriptions.length,
    sideIncomeTotal:     report.otherRevenues,
    totalIncome:         report.totalIncome,

    // Expenses (old shape kept for finance page)
    expensesBreakdown: report.expenses.items.map(i => ({
      id:               i.id,
      name:             i.name,
      percentage:       i.percentage,
      fixedAmount:      null,
      calculatedAmount: i.amount,
    })),
    totalExpenses: report.expenses.total - report.expenses.salaries, // exclude salaries (kept separate)

    // Salaries (full objects for salary card)
    salaries,
    totalSalaries: report.expenses.salaries,

    // Net profit
    netProfit: report.netProfit,

    // Visitors (old shape)
    visitors: {
      total:          report.visits,
      converted:      report.customerAcquisition,
      conversionRate: report.acquisitionFromVisits.percentage.toFixed(1),
    },

    // Goals
    goals: goalsData,

    // ── New report metrics (all new consumers should use these) ──
    report,
  })
}
