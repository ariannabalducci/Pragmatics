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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  const { exerciseId } = await params;
  const authUser = verifyToken(request);

  if (!authUser || authUser.role !== 'CHILD') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { duration_seconds, tries_till_correct, text_attempt } = body;

    const existingAttempt = await prisma.exerciseAttempt.findFirst({
      where: { childId: authUser.userId, exerciseId: exerciseId, success: true }
    });

    if (existingAttempt) return NextResponse.json({ error: 'Already completed' }, { status: 409 });

    const result = await prisma.$transaction(async (tx) => {
      await tx.exerciseAttempt.create({
        data: {
          childId: authUser.userId,
          exerciseId: exerciseId,
          durationSeconds: Number(duration_seconds),
          triesTillCorrect: Number(tries_till_correct),
          textAttempt: text_attempt,
          success: true,
        }
      });

      const COINS = 20;
      await tx.child.update({
        where: { userId: authUser.userId },
        data: { coins: { increment: COINS } }
      });

      const currentExercise = await tx.exercise.findUniqueOrThrow({
        where: { id: exerciseId },
        select: { groupId: true }
      });

      const totalExercisesCount = await tx.exercise.count({
        where: { groupId: currentExercise.groupId }
      });

      const completedExercisesCount = await tx.exerciseAttempt.count({
        where: {
          childId: authUser.userId,
          exercise: { groupId: currentExercise.groupId },
          success: true
        }
      });

      if (completedExercisesCount === totalExercisesCount) {
        const currentPath = await tx.path.findUnique({
          where: {
            childId_exerciseGroupId: {
                childId: authUser.userId,
                exerciseGroupId: currentExercise.groupId
            }
          }
        });

        if (currentPath) {
          await tx.path.update({
              where: { id: currentPath.id },
              data: { status: 'completed' }
          });

          const nextInPlaylist = await tx.path.findFirst({
              where: {
                  childId: authUser.userId,
                  status: 'blocked'
              },
              orderBy: { position: 'asc' }
          });

          if (nextInPlaylist) {
              await tx.path.update({
                  where: { id: nextInPlaylist.id },
                  data: { status: 'available' }
              });
          }
        }
      }

      return { success: true, coins_earned: COINS, group_completed: completedExercisesCount === totalExercisesCount };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Attempt Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}