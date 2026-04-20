import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET;

const verifyToken = (req: Request) => {
  if (!SECRET_KEY) throw new Error("JWT_SECRET not defined");
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded as { userId: string; role: string };
  } catch {
    return null;
  }
};

export async function GET(req: Request) {
  const authUser = verifyToken(req);
  if (!authUser || authUser.role !== "CHILD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    // Finestra: dalle 00:00 alle 23:59 del giorno corrente
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const appointment = await prisma.appointment.findFirst({
      where: {
        childId: authUser.userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        prescribedGroups: {
          select: { id: true }
        }
      },
      orderBy: { startTime: "asc" },
    });

    if (!appointment) {
      return NextResponse.json({ hasAppointment: false });
    }

    // Calcolo se la seduta è ATTIVA ora
    const appointmentStart = new Date(appointment.startTime);
    const durationMinutes = parseInt(appointment.duration?.split(" ")[0] || "45");
    const appointmentEnd = new Date(appointmentStart.getTime() + durationMinutes * 60000);
    
    // isActive è true se siamo nell'orario della seduta 
    // (Aggiungiamo un buffer di 5 minuti prima per sicurezza)
    const buffer = 5 * 60000;
    const isActive = now >= new Date(appointmentStart.getTime() - buffer) && now <= appointmentEnd;

    return NextResponse.json({
      hasAppointment: true,
      isActive,
      type: appointment.type,
      trainingExercises: appointment.trainingExercises,
      testingExercises: appointment.testingExercises,
      prescribedExercises: appointment.prescribedGroups.map(g => g.id),
      startTime: appointment.startTime.toISOString(),
      endTime: appointmentEnd.toISOString(),
    });
  } catch (error) {
    console.error("Errore appointments/today:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
