import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'b2561b53-26f9-41a2-80e0-acdd09faedbb'; // Timmy
  const groupType = 'perche';
  const mode = 'training';

  const child = await prisma.child.findUnique({
    where: { userId: userId },
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

  const groups = await prisma.exerciseGroup.findMany({
    where: { groupType: groupType as any },
    orderBy: { title: 'asc' },
    include: {
      exercises: {
        orderBy: { position: 'asc' },
        take: 1
      }
    }
  });

  const appointments = child?.appointments || [];
  const buffer = 5 * 60000;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  let prescribedGroupIds = new Set<string>();
  let isSessionActive = false;

  if (child) {
    let appointment = appointments[0];

    for (const app of appointments) {
      const appStart = new Date(app.startTime);
      if (appStart >= startOfDay && appStart <= endOfDay) {
        const durationMinutes = parseInt(app.duration?.split(" ")[0] || "45");
        const end = new Date(appStart.getTime() + durationMinutes * 60000);
        
        if (now >= new Date(appStart.getTime() - buffer) && now <= end) {
          appointment = app;
          isSessionActive = true;
          break;
        }
      }
    }

    if (isSessionActive && appointment) {
      prescribedGroupIds = new Set((appointment as any).prescribedGroups?.map((g: any) => g.id) || []);
    }
  }

  const isAttemptInSession = (createdAt: Date) => {
    const attTime = new Date(createdAt).getTime();
    return appointments.some(app => {
      const start = new Date(app.startTime).getTime();
      const durationMinutes = parseInt(app.duration?.split(" ")[0] || "45");
      const end = start + durationMinutes * 60000;
      return attTime >= start - buffer && attTime <= end;
    });
  };

  const homeAttempts = child?.attempts.filter(a => !isAttemptInSession(a.createdAt) && a.mode === mode) || [];
  const homeCompletedExerciseIds = new Set(homeAttempts.map(a => a.exerciseId));
  const todayCompletedExerciseIds = new Set(
      child?.attempts
          .filter(a => a.createdAt >= startOfDay && a.createdAt <= endOfDay)
          .map(a => a.exerciseId) || []
  );

  console.log(`isSessionActive: ${isSessionActive}`);
  console.log("homeAttempts length:", homeAttempts.length);
  console.log("homeAttempts:", homeAttempts.map(a => ({ exerciseId: a.exerciseId, createdAt: a.createdAt, inSession: isAttemptInSession(a.createdAt) })));

  const formatGroup = (group: any, index: number, totalGroups: any[]) => {
    const exercise = group.exercises[0];
    
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

    // Se è in corso una seduta ed è prescritto, lo sblocchiamo per oggi
    if (isSessionActive && prescribedGroupIds.has(group.id)) {
      const completedToday = group.exercises.every((ex: any) => todayCompletedExerciseIds.has(ex.id));
      status = completedToday ? 'completed' : 'available';
    }

    return {
      title: group.title,
      exerciseGroupId: group.id,
      exerciseId: exercise?.id ?? null,
      status: status,
    };
  };

  const results = groups.map((g, idx) => formatGroup(g, idx, groups));
  console.log("\nCalculated statuses:");
  console.log(results);
}

main().catch(console.error).finally(() => prisma.$disconnect());
