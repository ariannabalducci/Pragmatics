import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const authUser = getAuthUser(request);

  if (!authUser || authUser.userId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allItems = await prisma.collectionItem.findMany({
      orderBy: { price: 'asc' }
    });

    const child = await prisma.child.findUnique({
      where: { userId: userId },
      include: { unlockedItems: true }
    });

    if (!child) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const unlockedIds = new Set(child.unlockedItems.map(i => i.id));

    const response = allItems.map(item => ({
      parrot_id: item.id,
      name: item.name,
      image_id: item.imageId,
      price: item.price,
      unlocked: unlockedIds.has(item.id)
    }));

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get Collection Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const authUser = getAuthUser(request);

  if (!authUser || authUser.userId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { parrot_id } = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      const child = await tx.child.findUniqueOrThrow({ 
        where: { userId: userId },
        include: { unlockedItems: true }
      });
      
      const item = await tx.collectionItem.findUniqueOrThrow({ 
        where: { id: parrot_id } 
      });

      const isAlreadyUnlocked = child.unlockedItems.some(i => i.id === parrot_id);
      if (isAlreadyUnlocked) {
        throw new Error('Item already unlocked');
      }

      if (child.coins < item.price) {
        throw new Error(`Insufficient coins. You have ${child.coins}, need ${item.price}.`);
      }

      const updatedChild = await tx.child.update({
        where: { userId: userId },
        data: {
          coins: { decrement: item.price },
          unlockedItems: {
            connect: { id: parrot_id }
          }
        },
        include: { unlockedItems: true }
      });

      return {
        parrot_id: item.id,
        name: item.name,
        nr_coins: updatedChild.coins
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Buy Item Error:', error);
    const message = error instanceof Error ? error.message : '';
    const status = message.includes('coins') || message.includes('unlocked') ? 400 : 500;
    return NextResponse.json({ error: status === 400 ? message : 'Internal Server Error' }, { status });
  }
}