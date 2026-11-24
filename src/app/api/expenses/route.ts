import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  const now = new Date()
  const m = month ? parseInt(month) : now.getMonth() + 1
  const y = year ? parseInt(year) : now.getFullYear()

  const expenses = await prisma.expenseItem.findMany({
    where: { month: m, year: y },
    orderBy: { createdAt: 'asc' }
  })
  return NextResponse.json(expenses)
}

export async function POST(req: Request) {
  const body = await req.json()
  const expense = await prisma.expenseItem.create({
    data: {
      name: body.name,
      percentage: body.percentage ? parseFloat(body.percentage) : null,
      fixedAmount: body.fixedAmount ? parseFloat(body.fixedAmount) : null,
      month: body.month,
      year: body.year,
      isCore: body.isCore !== undefined ? body.isCore : true,
    }
  })
  return NextResponse.json(expense, { status: 201 })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.expenseItem.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
