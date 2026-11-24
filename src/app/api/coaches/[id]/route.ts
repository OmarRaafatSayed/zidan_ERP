import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const coach = await prisma.coach.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      phone: body.phone,
      baseSalary: parseFloat(body.baseSalary),
      bonusRate: body.bonusRate ? parseFloat(body.bonusRate) / 100 : 0,
    },
  })
  return NextResponse.json(coach)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.coach.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
