import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const branchId = searchParams.get('branchId')

  const startOfDay = date ? new Date(date) : new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setHours(23, 59, 59, 999)

  const checkIns = await prisma.checkIn.findMany({
    where: {
      checkInAt: { gte: startOfDay, lte: endOfDay },
      ...(branchId ? { branchId: parseInt(branchId) } : {})
    },
    include: { player: true, branch: true },
    orderBy: { checkInAt: 'desc' }
  })
  return NextResponse.json(checkIns)
}

export async function POST(req: Request) {
  const body = await req.json()

  let player = null

  /* ── 1. Direct pick by ID (SmartSearch confirmed selection) ── */
  if (body.playerId) {
    player = await prisma.player.findUnique({ where: { id: body.playerId } })
  }

  /* ── 2. Lookup by phone ── */
  if (!player && body.phone) {
    player = await prisma.player.findUnique({ where: { phone: body.phone } })
  }

  /* ── 3. Lookup by name fragment ── */
  if (!player && body.name) {
    player = await prisma.player.findFirst({
      where: { name: { contains: body.name } },
    })
  }

  /* ── 4. Create on-the-fly (walk-in / unknown) ── */
  if (!player) {
    player = await prisma.player.create({
      data: {
        name:  body.name  || 'زائر',
        phone: body.phone || undefined,
      },
    })
  }

  const checkIn = await prisma.checkIn.create({
    data: {
      playerId: player.id,
      branchId: body.branchId,
      notes:    body.notes,
    },
    include: { player: true, branch: true },
  })

  return NextResponse.json(checkIn, { status: 201 })
}
