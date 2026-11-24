import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const coaches = await prisma.coach.findMany({
    include: { salaries: { orderBy: { createdAt: 'desc' }, take: 3 } },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json(coaches)
}

export async function POST(req: Request) {
  const body = await req.json()
  const coach = await prisma.coach.create({
    data: {
      name: body.name,
      phone: body.phone,
      baseSalary: parseFloat(body.baseSalary),
      bonusRate: body.bonusRate ? parseFloat(body.bonusRate) : 0,
    }
  })
  return NextResponse.json(coach, { status: 201 })
}
