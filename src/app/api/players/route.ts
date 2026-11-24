import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q        = searchParams.get('q') || ''
  const branchId = searchParams.get('branchId')   // optional branch filter
  const take     = searchParams.get('take') ? parseInt(searchParams.get('take')!) : 20

  /*
   * When branchId is provided we return only players who have an active
   * subscription in that branch, so the autocomplete list stays relevant
   * to the selected branch context.
   */
  const players = await prisma.player.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name:  { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
      ...(branchId
        ? {
            subscriptions: {
              some: { branchId: parseInt(branchId) },
            },
          }
        : {}),
    },
    include: {
      subscriptions: {
        include: { branch: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take,   // caller can override the default 20-item cap
  })
  return NextResponse.json(players)
}

export async function POST(req: Request) {
  const body = await req.json()
  const player = await prisma.player.create({
    data: {
      name: body.name,
      phone: body.phone,
      email: body.email,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      notes: body.notes,
    }
  })
  return NextResponse.json(player, { status: 201 })
}
