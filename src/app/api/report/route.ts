/**
 * GET /api/report?month=M&year=Y
 *
 * Returns the full MonthlyReport object computed by reportMetrics.ts.
 * This is the single API endpoint all monthly-report UI should fetch.
 * The legacy /api/stats endpoint is kept for backward compatibility.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeMonthlyReport } from '@/lib/reportMetrics'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const now = new Date()
  const m = searchParams.get('month') ? parseInt(searchParams.get('month')!) : now.getMonth() + 1
  const y = searchParams.get('year')  ? parseInt(searchParams.get('year')!)  : now.getFullYear()

  // ── Date windows ──────────────────────────────────────────
  const startCurrent  = new Date(y, m - 1, 1)
  const endCurrent    = new Date(y, m, 0, 23, 59, 59, 999)

  // Previous month window (handles January → December of previous year)
  const prevM = m === 1 ? 12 : m - 1
  const prevY = m === 1 ? y - 1 : y
  const startPrevious = new Date(prevY, prevM - 1, 1)
  const endPrevious   = new Date(prevY, prevM, 0, 23, 59, 59, 999)

  // ── Current month subscriptions ──────────────────────────
  const currentMonthSubscriptions = await prisma.subscription.findMany({
    where: {
      createdAt: { gte: startCurrent, lte: endCurrent },
      status:    { not: 'cancelled' },
    },
    select: { id: true, playerId: true, amount: true, status: true, createdAt: true },
  })

  // ── Previous month subscriptions (for retention) ─────────
  const previousMonthSubscriptions = await prisma.subscription.findMany({
    where: {
      createdAt: { gte: startPrevious, lte: endPrevious },
      status:    { not: 'cancelled' },
    },
    select: { id: true, playerId: true, amount: true, status: true, createdAt: true },
  })

  // Distinct player IDs who had a subscription last month
  const previousMonthPlayerIds = [
    ...new Set(previousMonthSubscriptions.map(s => s.playerId)),
  ]

  // Players from last month who also have a new subscription this month
  const currentMonthPlayerIds = new Set(currentMonthSubscriptions.map(s => s.playerId))
  const renewedPlayerIds = previousMonthPlayerIds.filter(id => currentMonthPlayerIds.has(id))

  // ── Players count ────────────────────────────────────────
  // Count distinct players with at least one subscription (any status) in the system.
  const playersCount = await prisma.player.count()

  // ── Side income ──────────────────────────────────────────
  const sideIncomeItems = await prisma.sideIncome.findMany({
    where: { month: m, year: y },
    select: { amount: true },
  })
  const sideIncomeTotal = sideIncomeItems.reduce((s, i) => s + i.amount, 0)

  // ── Expenses ─────────────────────────────────────────────
  const expenses = await prisma.expenseItem.findMany({
    where: { month: m, year: y },
    select: { id: true, name: true, percentage: true, fixedAmount: true, isCore: true, month: true, year: true },
  })

  // ── Salaries ─────────────────────────────────────────────
  const salaries = await prisma.coachSalary.findMany({
    where: { month: m, year: y },
    select: {
      id: true, coachId: true,
      baseSalary: true, bonusAmount: true, totalPaid: true, paid: true,
      coach: { select: { name: true } },
    },
  })

  // ── Visitors ─────────────────────────────────────────────
  const visitors = await prisma.visitor.findMany({
    where: { visitDate: { gte: startCurrent, lte: endCurrent } },
    select: { id: true, source: true, converted: true },
  })

  // ── Compute report ───────────────────────────────────────
  const report = computeMonthlyReport({
    month: m,
    year:  y,
    currentMonthSubscriptions: currentMonthSubscriptions.map(s => ({
      ...s,
      createdAt: s.createdAt,
    })),
    previousMonthSubscriptions: previousMonthSubscriptions.map(s => ({
      ...s,
      createdAt: s.createdAt,
    })),
    renewedPlayerIds,
    previousMonthPlayerIds,
    playersCount,
    sideIncomeTotal,
    expenses,
    salaries: salaries.map(s => ({
      id: s.id,
      coachId: s.coachId,
      baseSalary: s.baseSalary,
      bonusAmount: s.bonusAmount,
      totalPaid: s.totalPaid,
      paid: s.paid,
      coach: s.coach,
    })),
    visitors,
  })

  return NextResponse.json(report)
}
