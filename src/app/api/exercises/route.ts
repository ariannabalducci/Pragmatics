import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

const GROUP_TYPE_LABELS: Record<string, string> = {
  generic: 'Storia/Chat',
  cloze: 'Completamento',
  feelings: 'Sentimenti',
  why: 'Perché',
  reactions: 'Reazioni',
};

export async function GET(request: Request) {
  const authUser = getAuthUser(request);
  if (!authUser || authUser.role !== 'THERAPIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const groups = await prisma.exerciseGroup.findMany({
      orderBy: [{ groupType: 'asc' }, { title: 'asc' }]
    });

    const formatted = groups.map(g => ({
      id: g.id,
      displayName: g.title,
      fileName: g.id,
      topic: g.topic,
      groupType: g.groupType,
      groupTypeLabel: GROUP_TYPE_LABELS[g.groupType] ?? g.groupType,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
