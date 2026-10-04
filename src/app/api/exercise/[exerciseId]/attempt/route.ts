import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  const { exerciseId } = await params;
  const authUser = getAuthUser(request);

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
          mode: mode || 'training',
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
          // CONTROLLO SE C'È UNA SEDUTA ATTIVA IN QUESTO MOMENTO
          const now = new Date();
          const startOfDay = new Date(now);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(now);
          endOfDay.setHours(23, 59, 59, 999);

          const appointments = await tx.appointment.findMany({
            where: {
              childId: authUser.userId,
              startTime: { gte: startOfDay, lte: endOfDay }
            }
          });

          let isSessionActive = false;
          const buffer = 5 * 60000; // 5 min buffer

          for (const app of appointments) {
            const start = new Date(app.startTime);
            const durationMinutes = parseInt(app.duration?.split(" ")[0] || "45");
            const end = new Date(start.getTime() + durationMinutes * 60000);
            
            if (now >= new Date(start.getTime() - buffer) && now <= end) {
              isSessionActive = true;
              break;
            }
          }

          // SE LA SEDUTA È ATTIVA, NON AGGIORNIAMO LA PATH (MAPPA A CASA)
          if (!isSessionActive) {
            await tx.path.update({
                where: { id: currentPath.id },
                data: { status: 'completed' }
            });

            // CONTROLLO LIMITE GIORNALIERO PRIMA DI SBLOCCARE IL PROSSIMO
            const appointment = appointments[0];
            let shouldUnlockNext = true;

            if (appointment) {
              const currentMode = mode || (appointment.type === 'valutazione' ? 'testing' : 'training');
              const limit = currentMode === 'testing' ? appointment.testingExercises : appointment.trainingExercises;

              if (limit > 0) {
                const availableGroupsCount = await tx.path.count({
                  where: {
                    childId: authUser.userId,
                    status: 'available'
                  }
                });
                
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