import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authUser = getAuthUser(request);
  const { userId } = await params;

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'training';

  if (!authUser || authUser.role !== 'CHILD' || authUser.userId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const child = await prisma.child.findUnique({
      where: { userId: userId },
      include: {
        user: true,
        attempts: {
          where: { success: true },
          orderBy: { createdAt: 'desc' }
        },
        appointments: {
          include: { prescribedGroups: true },
          orderBy: { startTime: 'desc' }
        },
        paths: {
          include: {
            exerciseGroup: {
              include: {
                exercises: {
                  orderBy: { position: 'asc' }
                }
              }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!child) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // A session is active only between its start time and start time + duration.
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const appointments = child.appointments;

    let isSessionActive = false;
    let appointment: (typeof appointments)[0] | null = null;

    for (const app of appointments) {
      const appStart = new Date(app.startTime);
      if (appStart >= startOfDay && appStart <= endOfDay) {
        const durationMinutes = parseInt(app.duration?.split(" ")[0] || "45");
        const appEnd = new Date(appStart.getTime() + durationMinutes * 60000);
        if (now >= appStart && now <= appEnd) {
          appointment = app;
          isSessionActive = true;
          break;
        }
      }
    }

    const prescribedGroupIds = new Set(isSessionActive && appointment ? ((appointment as any)?.prescribedGroups?.map((g: any) => g.id) || []) : []);

    let sessionCompletedExerciseIds = new Set<string>();
    if (isSessionActive && appointment) {
      const start = new Date(appointment.startTime).getTime();
      const durationMinutes = parseInt(appointment.duration?.split(" ")[0] || "45");
      const end = start + durationMinutes * 60000;
      
      const sessionAttempts = child.attempts.filter(a => {
        const attTime = new Date(a.createdAt).getTime();
        return attTime >= start && attTime <= end;
      });
      
      sessionCompletedExerciseIds = new Set(sessionAttempts.map(a => a.exerciseId));
    }

    // Home progress ignores attempts made during today's sessions.
    const isAttemptInAnySession = (createdAt: Date) => {
      const attTime = new Date(createdAt).getTime();
      return appointments.some(app => {
        const appStart = new Date(app.startTime);
        if (appStart < startOfDay || appStart > endOfDay) return false;
        const start = new Date(app.startTime).getTime();
        const durationMinutes = parseInt(app.duration?.split(" ")[0] || "45");
        const end = start + durationMinutes * 60000;
        return attTime >= start && attTime <= end;
      });
    };

    const homeAttempts = child.attempts.filter(a => !isAttemptInAnySession(a.createdAt) && a.mode === mode);
    const homeCompletedExerciseIds = new Set(homeAttempts.map(a => a.exerciseId));

    const activeLevels: any[] = [];
    // The main path only shows the generic story/chat groups.
    const genericPaths = child.paths.filter((p) => p.exerciseGroup.groupType === 'generic');

    const groupCompletedAtHome = genericPaths.map((path) => {
      const group = path.exerciseGroup;
      const completedCount = group.exercises.filter(ex => homeCompletedExerciseIds.has(ex.id)).length;
      return group.exercises.length > 0 && completedCount === group.exercises.length;
    });

    let firstAvailableFound = false;

    const allLevels = genericPaths.map((path, index) => {
        const group = path.exerciseGroup;
        const isPrescribedToday = prescribedGroupIds.has(group.id);
        
        if (isSessionActive) {
            let status = 'locked';
            let progress = 0;
            let activeExerciseId = group.exercises[0]?.id;

            if (isPrescribedToday) {
                const completedInGroupSession = group.exercises.filter(ex => 
                    sessionCompletedExerciseIds.has(ex.id)
                ).length;
                
                progress = group.exercises.length > 0 ? completedInGroupSession / group.exercises.length : 0;
                status = completedInGroupSession === group.exercises.length ? 'completed' : 'available';
                
                const currentEx = group.exercises.find((e) => !sessionCompletedExerciseIds.has(e.id));
                activeExerciseId = currentEx?.id || group.exercises[0]?.id;
            }

            const levelData = {
                id: path.id,
                groupId: path.exerciseGroupId,
                status,
                group_title: group.title,
                group_topic: group.topic,
                progress: progress >= 1 ? 2 : (progress > 0 ? 1 : 0),
                activeExerciseId,
                firstExerciseId: group.exercises[0]?.id
            };

            if (status === 'available') {
                activeLevels.push(levelData);
            }

            return levelData;
        }

        let status = 'locked';
        let progress = 0;
        let activeExerciseId = group.exercises[0]?.id;

        const isCompleted = groupCompletedAtHome[index];

        if (isCompleted) {
            status = 'completed';
            progress = 2;
        } else if (!firstAvailableFound) {
            status = 'available';
            firstAvailableFound = true;
            
            const completedInGroupCount = group.exercises.filter(ex => 
                homeCompletedExerciseIds.has(ex.id)
            ).length;
            progress = group.exercises.length > 0 ? completedInGroupCount / group.exercises.length : 0;
            const currentEx = group.exercises.find((e) => !homeCompletedExerciseIds.has(e.id));
            activeExerciseId = currentEx?.id || group.exercises[0]?.id;
        }

        const levelData = {
            id: path.id,
            groupId: path.exerciseGroupId,
            status,
            group_title: group.title,
            group_topic: group.topic,
            progress: progress >= 1 ? 2 : (progress > 0 ? 1 : 0),
            activeExerciseId,
            firstExerciseId: group.exercises[0]?.id
        };

        if (status === 'available') {
            activeLevels.push(levelData);
        }

        return levelData;
    });

    return NextResponse.json({
      coins: child.coins,
      nr_completed: allLevels.filter(l => l.status === 'completed').length,
      nr_locked: allLevels.filter(l => l.status === 'locked').length,
      levels: activeLevels,
      all_levels: allLevels,
      progressResetAt: child.progressResetAt ?? null,
    });

  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}