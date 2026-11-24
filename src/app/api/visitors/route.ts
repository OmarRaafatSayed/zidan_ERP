import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  const now = new Date()
  const m = month ? parseInt(month) : now.getMonth() + 1
  const y = year ? parseInt(year) : now.getFullYear()

  const startDate = new Date(y, m - 1, 1)
  const endDate = new Date(y, m, 0, 23, 59, 59)

  const visitors = await prisma.visitor.findMany({
    where: {
      visitDate: { gte: startDate, lte: endDate }
    },
    include: { subscription: true },
    orderBy: { visitDate: 'desc' }
  })

  const total = visitors.length
  const converted = visitors.filter(v => v.converted).length
  const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0'

  return NextResponse.json({ visitors, total, converted, conversionRate })
}

export async function POST(req: Request) {
  const body = await req.json()
  const visitor = await prisma.visitor.create({
    data: {
      name: body.name,
      phone: body.phone,
      source: body.source,
      referredBy: body.referredBy,
      notes: body.notes,
      visitDate: body.visitDate ? new Date(body.visitDate) : new Date(),
    }
  })
  return NextResponse.json(visitor, { status: 201 })
}
