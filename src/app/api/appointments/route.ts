import { NextResponse } from "next/server";
// Fai attenzione al percorso dell'import, deve puntare dove Prisma genera il client
import { PrismaClient } from "@/generated/prisma/client"; 

const prisma = new PrismaClient();

export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        child: {
          include: {
            user: true // Fondamentale per prendere Nome e Cognome dalla tabella User
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Formattiamo i dati affinché il frontend li legga facilmente
    const formatted = appointments.map((app) => ({
      id: app.id,
      patientName: `${app.child.user.name} ${app.child.user.surname}`,
      startTime: app.startTime.toISOString(),
      type: app.type,
      duration: app.duration,
      note: app.note,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Errore API Get:", error);
    return NextResponse.json({ error: "Errore nel caricamento" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const newAppointment = await prisma.appointment.create({
      data: {
        startTime: new Date(body.startTime),
        type: body.type,
        duration: body.duration,
        note: body.note,
        // Colleghiamo le relazioni usando i campi dello schema
        therapist: { connect: { userId: body.therapistId } },
        child: { connect: { userId: body.childId } },
      },
    });

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error("Errore API Post:", error);
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const appointmentId = url.searchParams.get("id");

    if (!appointmentId) {
      return NextResponse.json({ error: "ID appuntamento mancante" }, { status: 400 });
    }

    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore API Delete:", error);
    return NextResponse.json({ error: "Errore durante la cancellazione" }, { status: 500 });
  }
}
