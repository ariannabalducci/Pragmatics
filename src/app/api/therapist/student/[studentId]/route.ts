import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, isTherapistOf } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const authUser = getAuthUser(request);

  if (!authUser || authUser.role !== 'THERAPIST') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const student = await prisma.child.findUnique({
      where: { userId: studentId },
      include: {
        user: true,
        appointments: {
          orderBy: { startTime: 'desc' },
          include: { prescribedGroups: true }
        },
        attempts: {
          include: {
            exercise: {
              include: {
                group: true
              }
            }
          },
          orderBy: { createdAt: 'asc' } // Ascending for graph progression
        },
        _count: { select: { appointments: true } }
      },
    });

    if (!student || student.therapistId !== authUser.userId) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const now = new Date();

    const allApps = student.appointments.map(app => {
      const prescribedIds = app.prescribedGroups.map(g => g.id);
      const relatedAttempts = student.attempts.filter(attempt => {
        const start = new Date(app.startTime).getTime();
        const durationMinutes = parseInt(app.duration?.split(" ")[0] || "45");
        const end = start + durationMinutes * 60000;
        
        const attTime = new Date(attempt.createdAt).getTime();
        const buffer = 5 * 60000; // 5-minute tolerance
        
        const isInSessionTime = attTime >= start - buffer && attTime <= end + buffer;
        const isPrescribed = prescribedIds.includes(attempt.exercise.groupId);
        return isInSessionTime && isPrescribed;
      });

      return {
        id: app.id,
        date: app.startTime,
        type: app.type,
        duration: app.duration,
        note: app.note,
        isPast: new Date(app.startTime) < now,
        results: relatedAttempts.map(att => ({
          id: att.id,
          exerciseType: att.exercise.exerciseType,
          groupTitle: att.exercise.group.title,
          success: att.success,
          durationSeconds: att.durationSeconds,
          triesTillCorrect: att.triesTillCorrect,
          textAttempt: att.textAttempt,
          createdAt: att.createdAt
        }))
      };
    });

    const upcoming = allApps.filter(a => !a.isPast).reverse();
    const past = allApps.filter(a => a.isPast);

    // Progress chart: daily success rate, split into pragmatics and narrative topics.
    const categoriesMapping: Record<string, string> = {
      "Inferences": "pragmatics",
      "Irony": "pragmatics",
      "Conversation": "pragmatics",
      "Emotions": "pragmatics",
      "Narrative": "narrative",
      "Stories": "narrative",
      "Sequences": "narrative"
    };

    const progressData: { date: string; pragmatics: number | null; narrative: number | null }[] = [];
    const dateGroups: Record<string, { date: string; pragmatic: number; narration: number; countP: number; countN: number }> = {};

    student.attempts.forEach(att => {
        const dateStr = new Date(att.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        if (!dateGroups[dateStr]) dateGroups[dateStr] = { date: dateStr, narration: 0, pragmatic: 0, countP: 0, countN: 0 };
        
        const topic = att.exercise.group.topic;
        const category = categoriesMapping[topic] || (topic.toLowerCase().includes('narrative') ? 'narrative' : 'pragmatics');

        const score = att.success ? 100 : 0;

        if (category === 'pragmatics') {
            dateGroups[dateStr].pragmatic += score;
            dateGroups[dateStr].countP++;
        } else {
            dateGroups[dateStr].narration += score;
            dateGroups[dateStr].countN++;
        }
    });

    Object.values(dateGroups).forEach((g) => {
        progressData.push({
            date: g.date,
            pragmatics: g.countP > 0 ? Math.round(g.pragmatic / g.countP) : null,
            narrative: g.countN > 0 ? Math.round(g.narration / g.countN) : null
        });
    });

    return NextResponse.json({
      id: student.userId,
      name: student.user.name,
      surname: student.user.surname,
      age: student.age,
      initials: (student.user.name[0] + student.user.surname[0]).toUpperCase(),
      diagnosis: student.description || "", 
      objectives: student.diagnosis || "",
      notes: student.internalNotes || "",
      totalSessions: student.appointments.length,
      lastSessionDate: past[0]?.date || null,
      upcomingAppointments: upcoming,
      pastAppointments: past,
      progressData: progressData.slice(-10),
      progressResetAt: student.progressResetAt ?? null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const authUser = getAuthUser(request);

  if (!authUser || authUser.role !== 'THERAPIST') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    if (!(await isTherapistOf(authUser.userId, studentId))) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const body = await request.json();
    const { description, diagnosis, internalNotes, appointmentId, appointmentNote } = body;

    if (description !== undefined || diagnosis !== undefined || internalNotes !== undefined) {
      await prisma.child.update({
        where: { userId: studentId },
        data: {
          description: description,
          diagnosis: diagnosis,
          internalNotes: internalNotes
        },
      });
    }

    if (appointmentId && appointmentNote !== undefined) {
      await prisma.appointment.updateMany({
        where: { id: appointmentId, childId: studentId, therapistId: authUser.userId },
        data: { note: appointmentNote }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating the patient:', error);
    return NextResponse.json({ error: 'Error updating the patient' }, { status: 500 });
  }
}