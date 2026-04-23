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

    const appointments = await prisma.appointment.findMany({
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

    if (appointments.length === 0) {
      return NextResponse.json({ hasAppointment: false });
    }

    // Troviamo l'appuntamento attivo, o il prossimo
    let appointment = appointments[0];
    let isActive = false;
    let appointmentStart = new Date(appointment.startTime);
    let durationMinutes = parseInt(appointment.duration?.split(" ")[0] || "45");
    let appointmentEnd = new Date(appointmentStart.getTime() + durationMinutes * 60000);

    const buffer = 5 * 60000;

    for (const app of appointments) {
      const start = new Date(app.startTime);
      const dur = parseInt(app.duration?.split(" ")[0] || "45");
      const end = new Date(start.getTime() + dur * 60000);

      const active = now >= new Date(start.getTime() - buffer) && now <= end;
      
      if (active) {
        appointment = app;
        isActive = true;
        appointmentStart = start;
        durationMinutes = dur;
        appointmentEnd = end;
        break;
      } else if (now < start && !isActive) {
        // Se non ne abbiamo ancora trovato uno attivo, e questo è nel futuro, teniamolo come fallback visivo
        appointment = app;
        appointmentStart = start;
        durationMinutes = dur;
        appointmentEnd = end;
      }
    }

    console.log("=== APPOINTMENT DEBUG ===");
    console.log("Current Time (now):", now.toISOString());
    console.log("Appointment Start:", appointmentStart.toISOString());
    console.log("Appointment End:", appointmentEnd.toISOString());
    console.log("Calculated duration:", durationMinutes);
    console.log("Is Active?:", isActive);

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
