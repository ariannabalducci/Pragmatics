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
    const { duration_seconds, tries_till_correct, text_attempt, mode } = body;

    // Permettiamo salvataggi multipli dello stesso esercizio per supportare il "redo" clinico
    // const existingAttempt = await prisma.exerciseAttempt.findFirst({
    //   where: { childId: authUser.userId, exerciseId: exerciseId, success: true }
    // });
    // if (existingAttempt) return NextResponse.json({ error: 'Already completed' }, { status: 409 });

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

      let groupCompleted = false;
      if (completedExercisesCount === totalExercisesCount) {
        groupCompleted = true;
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

          // CONTROLLO LIMITE GIORNALIERO PRIMA DI SBLOCCARE IL PROSSIMO
          const now = new Date();
          const startOfDay = new Date(now);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(now);
          endOfDay.setHours(23, 59, 59, 999);

          const appointment = await tx.appointment.findFirst({
            where: {
              childId: authUser.userId,
              startTime: { gte: startOfDay, lte: endOfDay }
            }
          });

          let shouldUnlockNext = true;

          if (appointment) {
            // Determiniamo il limite in base al mode passato o al tipo di appuntamento
            const currentMode = mode || (appointment.type === 'valutazione' ? 'testing' : 'training');
            const limit = currentMode === 'testing' ? appointment.testingExercises : appointment.trainingExercises;

            if (limit > 0) {
              const availableGroupsCount = await tx.path.count({
                where: {
                  childId: authUser.userId,
                  status: 'available'
                }
              });
              
              // Se abbiamo già raggiunto o superato il limite di gruppi "disponibili", non sblocchiamo il prossimo
              if (availableGroupsCount >= limit) {
                shouldUnlockNext = false;
              }
            }
          }

          if (shouldUnlockNext) {
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
      }

      return { success: true, coins_earned: COINS, group_completed: groupCompleted };
    }, {
      maxWait: 5000,
      timeout: 20000,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Attempt Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}