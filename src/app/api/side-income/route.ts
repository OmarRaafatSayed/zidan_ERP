import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  const now = new Date()
  const m = month ? parseInt(month) : now.getMonth() + 1
  const y = year ? parseInt(year) : now.getFullYear()

  const items = await prisma.sideIncome.findMany({
    where: { month: m, year: y },
    orderBy: { date: 'desc' }
  })
  const total = items.reduce((sum, i) => sum + i.amount, 0)
  return NextResponse.json({ items, total })
}

export async function POST(req: Request) {
  const body = await req.json()
  const now = new Date()
  const item = await prisma.sideIncome.create({
    data: {
      description: body.description,
      amount: parseFloat(body.amount),
      date: body.date ? new Date(body.date) : now,
      month: body.month || now.getMonth() + 1,
      year: body.year || now.getFullYear(),
    }
  })
  return NextResponse.json(item, { status: 201 })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.sideIncome.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
