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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const authUser = verifyToken(request);

  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    if (!student) return NextResponse.json({ error: 'Paziente non trovato' }, { status: 404 });

    const now = new Date();

    // Raggruppamento appuntamenti
    const allApps = student.appointments.map(app => {
      const prescribedIds = app.prescribedGroups.map(g => g.id);
      const relatedAttempts = student.attempts.filter(attempt => {
        const start = new Date(app.startTime).getTime();
        const durationMinutes = parseInt(app.duration?.split(" ")[0] || "45");
        const end = start + durationMinutes * 60000;
        
        const attTime = new Date(attempt.createdAt).getTime();
        const buffer = 5 * 60000; // 5 minuti di tolleranza
        
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

    // Dati per il grafico (Progressi nel tempo)
    // Mappa i topic a categorie fisse
    const categoriesMapping: Record<string, string> = {
      "Inferenze": "Pragmatica",
      "Ironia": "Pragmatica",
      "Conversazione": "Pragmatica",
      "Emozioni": "Pragmatica",
      "Narrazione": "Narrazione",
      "Storie": "Narrazione",
      "Sequenze": "Narrazione"
    };

    const progressData: any[] = [];
    const dateGroups: Record<string, any> = {};

    student.attempts.forEach(att => {
        const dateStr = new Date(att.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
        if (!dateGroups[dateStr]) dateGroups[dateStr] = { date: dateStr, projects: 0, narration: 0, pragmatic: 0, countP: 0, countN: 0 };
        
        const topic = att.exercise.group.topic;
        const category = categoriesMapping[topic] || (topic.toLowerCase().includes('narrazione') ? 'Narrazione' : 'Pragmatica');
        
        const score = att.success ? 100 : 0; // Semplificato, o 100 - (tries * 10)
        
        if (category === 'Pragmatica') {
            dateGroups[dateStr].pragmatic += score;
            dateGroups[dateStr].countP++;
        } else {
            dateGroups[dateStr].narration += score;
            dateGroups[dateStr].countN++;
        }
    });

    Object.values(dateGroups).forEach((g: any) => {
        progressData.push({
            date: g.date,
            pragmatica: g.countP > 0 ? Math.round(g.pragmatic / g.countP) : null,
            narrazione: g.countN > 0 ? Math.round(g.narration / g.countN) : null
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
      progressData: progressData.slice(-10), // Ultime 10 rilevazioni
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
  try {
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
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { note: appointmentNote }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}