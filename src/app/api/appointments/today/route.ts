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
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const GRACE_FUTURE_MS = 15 * 60000; // 15 minuti di margine nel futuro

    const appointments = await prisma.appointment.findMany({
      where: {
        childId: authUser.userId,
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        prescribedGroups: { select: { id: true } }
      },
      orderBy: { startTime: "asc" },
    });

    if (appointments.length === 0) {
      return NextResponse.json({ hasAppointment: false });
    }

    // Approccio robusto: un appuntamento è "attivo" se il suo orario è già passato
    // (con un margine di 15 minuti nel futuro per gestire piccoli disallineamenti)
    let appointment = appointments[0];
    let isActive = false;
    let appointmentStart = new Date(appointment.startTime);
    let durationMinutes = parseInt(appointment.duration?.split(" ")[0] || "45");
    let appointmentEnd = new Date(appointmentStart.getTime() + durationMinutes * 60000);

    for (const app of appointments) {
      const start = new Date(app.startTime);
      const dur = parseInt(app.duration?.split(" ")[0] || "45");
      const end = new Date(start.getTime() + dur * 60000);

      // Attivo SOLO nell'esatto intervallo [startTime, endTime]
      if (now >= start && now <= end) {
        appointment = app;
        isActive = true;
        appointmentStart = start;
        durationMinutes = dur;
        appointmentEnd = end;
        break;
      } else if (now < start && !isActive) {
        // Prossimo futuro come fallback visivo
        appointment = app;
        appointmentStart = start;
        durationMinutes = dur;
        appointmentEnd = end;
      }
    }

    // sessionMode: mappa il tipo DB al valore atteso dal frontend, solo se attivo
    const sessionMode = isActive
      ? (appointment.type === "valutazione" ? "testing" : "training")
      : null;

    return NextResponse.json({
      hasAppointment: true,
      isActive,
      type: appointment.type,
      sessionMode,
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
