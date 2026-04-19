import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client"; 

const prisma = new PrismaClient();

export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        child: { include: { user: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    const formatted = appointments.map((app) => ({
      id: app.id,
      childName: `${app.child.user.name} ${app.child.user.surname}`, // Cambiato da patientName a childName
      startTime: app.startTime.toISOString(),
      type: app.type,
      duration: app.duration,
      note: app.note,
 }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Errore nel caricamento" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { startTime, type, duration, note, childId } = body;
    
    const therapist = await prisma.therapist.findFirst();
    
    if (!therapist || !childId) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        startTime: new Date(startTime),
        type: type,
        // Converte in numero intero ed evita stringhe sporche
        duration: `${duration} min`, 
        note: note,
        therapistId: therapist.userId,
        childId: childId,
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Errore Prisma dettagliato:", error); // Controlla i log dopo questa riga
    return NextResponse.json({ error: "Errore salvataggio DB" }, { status: 500 });
  }
}