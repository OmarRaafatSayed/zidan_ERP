import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const branches = await prisma.branch.findMany({
    include: {
      _count: {
        select: { subscriptions: true, checkIns: true }
      }
    },
    orderBy: { year: 'asc' }
  })
  return NextResponse.json(branches)
}

export async function POST(req: Request) {
  const body = await req.json()
  const branch = await prisma.branch.create({
    data: {
      name: body.name,
      year: body.year || null,
    }
  })
  return NextResponse.json(branch, { status: 201 })
}

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await req.json()
  const branch = await prisma.branch.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      year: body.year || null,
    }
  })
  return NextResponse.json(branch)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    await prisma.branch.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'لا يمكن حذف الفرع لوجود بيانات مرتبطة به' },
      { status: 409 }
    )
  }
}
