import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  const now = new Date()
  const m = month ? parseInt(month) : now.getMonth() + 1
  const y = year ? parseInt(year) : now.getFullYear()

  const salaries = await prisma.coachSalary.findMany({
    where: { month: m, year: y },
    include: { coach: true }
  })
  return NextResponse.json(salaries)
}

export async function POST(req: Request) {
  const body = await req.json()

  // Calculate bonus
  const coach = await prisma.coach.findUnique({ where: { id: body.coachId } })
  if (!coach) return NextResponse.json({ error: 'Coach not found' }, { status: 404 })

  const bonusAmount = body.bonusAmount !== undefined
    ? parseFloat(body.bonusAmount)
    : (body.applyBonus ? coach.baseSalary * coach.bonusRate : 0)

  const totalPaid = coach.baseSalary + bonusAmount

  const salary = await prisma.coachSalary.create({
    data: {
      coachId: body.coachId,
      month: body.month,
      year: body.year,
      baseSalary: coach.baseSalary,
      bonusAmount,
      totalPaid,
      paid: body.paid || false,
      notes: body.notes,
    },
    include: { coach: true }
  })

  return NextResponse.json(salary, { status: 201 })
}
