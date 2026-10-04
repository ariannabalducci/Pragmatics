import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/exercises/by-type/[groupType]
 *
 * Returns every ExerciseGroup of the given type (cloze, feelings, why, reactions)
 * with its status for the authenticated child:
 * { exerciseGroupId, exerciseId, title, topic, groupType, status, contentJson }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupType: string }> }
) {
  const authUser = getAuthUser(request);
  if (!authUser || authUser.role !== 'CHILD') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupType } = await params;

  const validTypes = ['cloze', 'feelings', 'why', 'reactions', 'generic'];
  if (!validTypes.includes(groupType)) {
    return NextResponse.json({ error: 'Invalid groupType' }, { status: 400 });
  }

  try {
    const groups = await prisma.exerciseGroup.findMany({
      where: { groupType: groupType as any },
      orderBy: { title: 'asc' },
      include: {
        exercises: {
          orderBy: { position: 'asc' },
          take: 1 // special groups have a single exercise
        },
        paths: {
          where: { childId: authUser.userId }
        }
      }
    });

    // A session is active only between its start time and start time + duration.
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const child = await prisma.child.findUnique({
      where: { userId: authUser.userId },
      include: {
        attempts: {
          where: { success: true },
          orderBy: { createdAt: 'desc' }
        },
        appointments: {
          include: { prescribedGroups: true },
          orderBy: { startTime: 'desc' }
        }
      }
    });

    let prescribedGroupIds = new Set<string>();
    let isSessionActive = false;
    let sessionCompletedExerciseIds = new Set<string>();
    const appointments = child?.appointments || [];

    if (child) {
      let activeAppointment: any = null;

      for (const app of appointments) {
        const appStart = new Date(app.startTime);
        if (appStart >= startOfDay && appStart <= endOfDay) {
          const durationMinutes = parseInt(app.duration?.split(" ")[0] || "45");
          const appEnd = new Date(appStart.getTime() + durationMinutes * 60000);
          if (now >= appStart && now <= appEnd) {
            activeAppointment = app;
            isSessionActive = true;
            break;
          }
        }
      }

      if (isSessionActive && activeAppointment) {
        prescribedGroupIds = new Set((activeAppointment as any).prescribedGroups?.map((g: any) => g.id) || []);
        
        const start = new Date(activeAppointment.startTime).getTime();
        const durationMinutes = parseInt(activeAppointment.duration?.split(" ")[0] || "45");
        const end = start + durationMinutes * 60000;
        
        const sessionAttempts = child.attempts.filter(a => {
          const attTime = new Date(a.createdAt).getTime();
          return attTime >= start && attTime <= end;
        });
        
        sessionCompletedExerciseIds = new Set(sessionAttempts.map(a => a.exerciseId));
      }
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'training';

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

    const homeAttempts = child?.attempts.filter(a => !isAttemptInAnySession(a.createdAt) && a.mode === mode) || [];
    const homeCompletedExerciseIds = new Set(homeAttempts.map(a => a.exerciseId));

    const formatGroup = (group: any, index: number, totalGroups: any[]) => {
      const exercise = group.exercises[0];
      
      if (isSessionActive) {
        if (prescribedGroupIds.has(group.id)) {
          const completedInSession = group.exercises.every((ex: any) => sessionCompletedExerciseIds.has(ex.id));
          return {
            exerciseGroupId: group.id,
            exerciseId: exercise?.id ?? null,
            title: group.title,
            topic: group.topic,
            groupType: group.groupType,
            status: completedInSession ? 'completed' : 'available',
            contentJson: exercise?.contentJson ?? null,
          };
        } else {
          return {
            exerciseGroupId: group.id,
            exerciseId: exercise?.id ?? null,
            title: group.title,
            topic: group.topic,
            groupType: group.groupType,
            status: 'blocked',
            contentJson: exercise?.contentJson ?? null,
          };
        }
      }

      const completedCount = group.exercises.filter((ex: any) => homeCompletedExerciseIds.has(ex.id)).length;
      const isCompleted = group.exercises.length > 0 && completedCount === group.exercises.length;

      let isFirstUncompleted = false;
      if (!isCompleted) {
        const previousGroups = totalGroups.slice(0, index);
        const allPreviousCompleted = previousGroups.every((prev) => {
          const prevCompletedCount = prev.exercises.filter((ex: any) => homeCompletedExerciseIds.has(ex.id)).length;
          return prev.exercises.length > 0 && prevCompletedCount === prev.exercises.length;
        });
        isFirstUncompleted = allPreviousCompleted;
      }

      let status = 'blocked';
      if (isCompleted) {
        status = 'completed';
      } else if (isFirstUncompleted) {
        status = 'available';
      }

      return {
        exerciseGroupId: group.id,
        exerciseId: exercise?.id ?? null,
        title: group.title,
        topic: group.topic,
        groupType: group.groupType,
        status: status,
        contentJson: exercise?.contentJson ?? null,
      };
    };

    // Create the child's paths for this type on first access.
    if (groups.length > 0 && groups.every(g => g.paths.length === 0)) {
      const existingPathCount = await prisma.path.count({
        where: { childId: authUser.userId }
      });

      await prisma.$transaction(
        groups.map((group, i) =>
          prisma.path.create({
            data: {
              childId: authUser.userId,
              exerciseGroupId: group.id,
              status: i === 0 ? 'available' : 'blocked',
              position: existingPathCount + i
            }
          })
        )
      );

      const refreshed = await prisma.exerciseGroup.findMany({
        where: { groupType: groupType as any },
        orderBy: { title: 'asc' },
        include: {
          exercises: { orderBy: { position: 'asc' }, take: 1 },
          paths: { where: { childId: authUser.userId } }
        }
      });

      return NextResponse.json(refreshed.map((g, idx) => formatGroup(g, idx, refreshed)));
    }

    return NextResponse.json(groups.map((g, idx) => formatGroup(g, idx, groups)));
  } catch (error) {
    console.error('Error fetching exercises by type:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
