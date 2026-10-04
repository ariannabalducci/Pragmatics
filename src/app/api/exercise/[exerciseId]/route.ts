import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ exerciseId: string }> }
) {
    const authUser = getAuthUser(request);
    const { exerciseId } = await params;

    if (!authUser || authUser.role !== 'CHILD') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const exercise = await prisma.exercise.findUnique({
            where: { id: exerciseId },
            include: {
                group: {
                    include: {
                        paths: {
                            where: { childId: authUser.userId }
                        }
                    }
                }
            }
        });

        if (!exercise) {
            return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode') || 'training';

        const groupType = exercise.group.groupType;
        const isSpecialCategory = groupType !== 'generic';

        let isAvailable = false;

        if (isSpecialCategory) {
            // Calcolo dinamico dello stato per le categorie speciali
            const groups = await prisma.exerciseGroup.findMany({
                where: { groupType: groupType as any },
                orderBy: { title: 'asc' },
                include: {
                    exercises: {
                        orderBy: { position: 'asc' }
                    }
                }
            });

            const currentGroupIndex = groups.findIndex(g => g.id === exercise.groupId);

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

            if (child && currentGroupIndex !== -1) {
                const appointments = child.appointments || [];
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

                let isSessionActive = false;
                let prescribedGroupIds = new Set<string>();
                let activeAppointment: any = null;

                for (const app of appointments) {
                    const appStart = new Date(app.startTime);
                    if (appStart >= startOfDay && appStart <= endOfDay) {
                        const durationMinutes = parseInt(app.duration?.split(" ")[0] || "45");
                        const appEnd = new Date(appStart.getTime() + durationMinutes * 60000);
                        // Stretto: attivo solo nell'esatto intervallo [startTime, endTime]
                        if (now >= appStart && now <= appEnd) {
                            isSessionActive = true;
                            activeAppointment = app;
                            prescribedGroupIds = new Set(app.prescribedGroups?.map((g: any) => g.id) || []);
                            break;
                        }
                    }
                }

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
                
                let sessionCompletedExerciseIds = new Set<string>();
                if (isSessionActive && activeAppointment) {
                    const start = new Date(activeAppointment.startTime).getTime();
                    const durationMinutes = parseInt(activeAppointment.duration?.split(" ")[0] || "45");
                    const end = start + durationMinutes * 60000;
                    
                    const sessionAttempts = child.attempts.filter(a => {
                        const attTime = new Date(a.createdAt).getTime();
                        return attTime >= start && attTime <= end;
                    });
                    
                    sessionCompletedExerciseIds = new Set(sessionAttempts.map(a => a.exerciseId));
                }

                const getGroupStatus = (group: any, index: number, totalGroups: any[]) => {
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

                    if (isSessionActive && prescribedGroupIds.has(group.id)) {
                        const completedInSession = group.exercises.every((ex: any) => sessionCompletedExerciseIds.has(ex.id));
                        status = completedInSession ? 'completed' : 'available';
                    }

                    return status;
                };

                const currentGroupStatus = getGroupStatus(groups[currentGroupIndex], currentGroupIndex, groups);
                isAvailable = currentGroupStatus === 'available' || currentGroupStatus === 'completed';
            }
        } else {
            // Esercizi generici: controlla prima sessione attiva, poi progressione casa
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

            const todayAppointments = await prisma.appointment.findMany({
                where: {
                    childId: authUser.userId,
                    startTime: { gte: startOfDay, lte: endOfDay }
                },
                include: { prescribedGroups: true },
                orderBy: { startTime: 'asc' }
            });

            let sessionPrescribedIds = new Set<string>();
            for (const app of todayAppointments) {
                const start = new Date(app.startTime);
                const dur = parseInt(app.duration?.split(' ')[0] || '45');
                const end = new Date(start.getTime() + dur * 60000);
                if (now >= start && now <= end) {
                    sessionPrescribedIds = new Set(app.prescribedGroups.map((g: any) => g.id));
                    break;
                }
            }

            // Sessione attiva + esercizio prescritto → sempre disponibile
            if (sessionPrescribedIds.has(exercise.groupId)) {
                isAvailable = true;
            } else {
                // Fuori sessione: usa status dal DB come approssimazione
                const studentPath = exercise.group.paths[0];
                if (studentPath) {
                    isAvailable = studentPath.status === 'available' || studentPath.status === 'completed';
                }
            }
        }

        if (!isAvailable) {
            return NextResponse.json({ error: 'This exercise group is not available' }, { status: 403 });
        }

        const successfulAttempts = await prisma.exerciseAttempt.findMany({
            where: {
                childId: authUser.userId,
                exercise: { groupId: exercise.groupId },
                success: true
            },
            distinct: ['exerciseId'],
            select: { exerciseId: true }
        });

        const completedCount = successfulAttempts.length;

        // Skip check sequenziale se l'esercizio è prescritto in una sessione attiva
        const now2 = new Date();
        const sod2 = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate());
        const eod2 = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate(), 23, 59, 59);
        const activeApp = await prisma.appointment.findFirst({
            where: { childId: authUser.userId, startTime: { gte: sod2, lte: eod2 } },
            include: { prescribedGroups: true },
            orderBy: { startTime: 'asc' }
        });
        const isInActiveSession = activeApp && (() => {
            const s = new Date(activeApp.startTime);
            const d = parseInt(activeApp.duration?.split(' ')[0] || '45');
            const e = new Date(s.getTime() + d * 60000);
            return now2 >= s && now2 <= e;
        })() && activeApp.prescribedGroups.some((g: any) => g.id === exercise.groupId);

        if (!isInActiveSession && exercise.position > completedCount + 1) {
             return NextResponse.json({ 
                 error: `You must complete the previous exercises first.`
             }, { status: 403 });
        }

        return NextResponse.json({
            id: exercise.id,
            content_json: exercise.contentJson
        });

    } catch (error) {
        console.error('Error fetching exercise detail:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}