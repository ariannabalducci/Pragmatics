import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

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

/**
 * GET /api/exercises/by-type/[groupType]
 *
 * Restituisce tutti i ExerciseGroup di un dato tipo (cloze, sentimenti, perche, reazioni)
 * con lo stato del Path del bambino autenticato.
 *
 * Response item shape:
 * {
 *   exerciseGroupId: string   // ID del ExerciseGroup
 *   exerciseId: string        // ID del singolo Exercise (uno per gruppo)
 *   title: string
 *   topic: string
 *   groupType: string
 *   status: "available" | "blocked" | "completed"
 *   contentJson: object       // Dati specifici dell'esercizio (dal DB)
 * }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupType: string }> }
) {
  const authUser = verifyToken(request);
  if (!authUser || authUser.role !== 'CHILD') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupType } = await params;

  // Valida il groupType
  const validTypes = ['cloze', 'sentimenti', 'perche', 'reazioni', 'generic'];
  if (!validTypes.includes(groupType)) {
    return NextResponse.json({ error: 'Invalid groupType' }, { status: 400 });
  }

  try {
    // Carica tutti i gruppi del tipo richiesto con i Path del bambino
    const groups = await prisma.exerciseGroup.findMany({
      where: { groupType: groupType as any },
      orderBy: [
        // Per perche, mantieni l'ordine originale
        { title: 'asc' }
      ],
      include: {
        exercises: {
          orderBy: { position: 'asc' },
          take: 1 // Ogni gruppo speciale ha un solo esercizio
        },
        paths: {
          where: { childId: authUser.userId }
        }
      }
    });

    // Rilevamento seduta attiva — STRETTO: attiva solo nell'esatto intervallo [startTime, end].
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

    // Se il bambino non ha ancora Path per questo tipo, creali automaticamente
    if (groups.length > 0 && groups.every(g => g.paths.length === 0)) {
      // Conta le posizioni esistenti per calcolare offset
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

      // Ricarica dopo la creazione
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
