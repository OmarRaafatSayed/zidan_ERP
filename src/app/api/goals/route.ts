import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  const now = new Date()
  const m = month ? parseInt(month) : now.getMonth() + 1
  const y = year ? parseInt(year) : now.getFullYear()

  const goals = await prisma.monthlyGoal.findMany({
    where: { month: m, year: y },
    include: { branch: true }
  })
  return NextResponse.json(goals)
}

export async function POST(req: Request) {
  const body = await req.json()

  // Upsert: update if exists, create if not
  const existing = await prisma.monthlyGoal.findFirst({
    where: { branchId: body.branchId, month: body.month, year: body.year }
  })

  if (existing) {
    const updated = await prisma.monthlyGoal.update({
      where: { id: existing.id },
      data: { targetCount: body.targetCount }
    })
    return NextResponse.json(updated)
  }

  const goal = await prisma.monthlyGoal.create({
    data: {
      branchId: body.branchId,
      month: body.month,
      year: body.year,
      targetCount: body.targetCount,
    }
  })
  return NextResponse.json(goal, { status: 201 })
}
