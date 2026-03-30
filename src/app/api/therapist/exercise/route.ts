import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

const verifyToken = (req: Request) => {
  if (!SECRET_KEY) throw new Error('JWT_SECRET not defined');
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded as { userId: string; role: string };
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  const authUser = verifyToken(request);
  if (!authUser || authUser.role !== 'THERAPIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { exercise_group_title, exercise_group_topic, exercises } = await request.json();

    if (!exercises || exercises.length === 0) {
      return NextResponse.json({ error: 'Exercises required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const therapist = await tx.therapist.findUniqueOrThrow({
        where: { userId: authUser.userId }
      });

      const group = await tx.exerciseGroup.create({
        data: {
          title: exercise_group_title,
          topic: exercise_group_topic,
          exercises: {
            create: exercises.map((ex: any, index: number) => ({
              contentJson: ex.content_json,
              position: index + 1
            }))
          }
        }
      });

      const allChildren = await tx.child.findMany({
        select: { userId: true }
      });

      for (const child of allChildren) {
        const activeCount = await tx.path.count({
          where: { childId: child.userId, status: 'available' }
        });

        const lastPath = await tx.path.findFirst({
          where: { childId: child.userId },
          orderBy: { position: 'desc' }
        });
        
        const nextPlaylistPosition = (lastPath?.position ?? 0) + 1;

        const initialStatus = activeCount < 2 ? 'available' : 'blocked';

        await tx.path.create({
          data: {
            childId: child.userId,
            exerciseGroupId: group.id,
            status: initialStatus,
            position: nextPlaylistPosition
          }
        });
      }

      return group;
    });

    return NextResponse.json({ success: true, group_id: result.id });

  } catch (error) {
    console.error('Create exercise error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}