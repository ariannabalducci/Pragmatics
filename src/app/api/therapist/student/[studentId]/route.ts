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

// Aggiungi o aggiorna la GET nel tuo route.ts
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
          orderBy: { startTime: 'asc' }, // Ordine cronologico per il calendario
        },
        _count: { select: { attempts: true } }
      },
    });

    if (!student) return NextResponse.json({ error: 'Paziente non trovato' }, { status: 404 });

    return NextResponse.json({
      id: student.userId,
      name: student.user.name,
      surname: student.user.surname,
      age: student.age,
      initials: (student.user.name[0] + student.user.surname[0]).toUpperCase(),
      diagnosis: student.description || "", 
      totalSessions: student._count.attempts,
      lastSessionDate: student.appointments[0]?.startTime || null,
      // Usiamo il campo 'diagnosis' del DB per salvare gli obiettivi separati da ";"
      objectives: student.diagnosis ? student.diagnosis.split(';') : [],
      // Usiamo note se presenti o una stringa vuota
      notes: "", 
      appointments: student.appointments.map(app => ({
        id: app.id,
        date: app.startTime, 
        type: app.type,
        duration: app.duration,
        note: app.note
      }))
    });
  } catch (error) {
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
    const { description, diagnosis, notes, appointmentId, appointmentNote } = body;

    // 1. Aggiornamento dati generali del bambino (Diagnosi e Obiettivi)
    if (description !== undefined || diagnosis !== undefined) {
      await prisma.child.update({
        where: { userId: studentId },
        data: {
          description: description, // Diagnosi
          diagnosis: diagnosis,     // Obiettivi (stringa o separata da ;)
        },
      });
    }

    // 2. Aggiornamento note specifiche di un appuntamento
    if (appointmentId && appointmentNote !== undefined) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { note: appointmentNote }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Errore durante il salvataggio' }, { status: 500 });
  }
}