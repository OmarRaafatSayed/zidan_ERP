import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get('branchId')
  const status = searchParams.get('status')

  const subscriptions = await prisma.subscription.findMany({
    where: {
      ...(branchId ? { branchId: parseInt(branchId) } : {}),
      ...(status ? { status } : {})
    },
    include: { player: true, branch: true, visitor: true },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(subscriptions)
}

export async function POST(req: Request) {
  const body = await req.json()

  // If coming from visitor conversion, mark visitor as converted
  if (body.visitorId) {
    await prisma.visitor.update({
      where: { id: body.visitorId },
      data: { converted: true }
    })
  }

  const subscription = await prisma.subscription.create({
    data: {
      playerId: body.playerId,
      branchId: body.branchId,
      visitorId: body.visitorId,
      amount: parseFloat(body.amount),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      sessionType: body.sessionType,
      status: 'active',
      notes: body.notes,
    },
    include: { player: true, branch: true }
  })

  return NextResponse.json(subscription, { status: 201 })
}
