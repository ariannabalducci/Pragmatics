import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== "CHILD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

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

    const endOf = (app: (typeof appointments)[number]) =>
      new Date(new Date(app.startTime).getTime() + parseInt(app.duration?.split(" ")[0] || "45") * 60000);

    // The appointment in progress, otherwise the next one today, otherwise the first of the day.
    const active = appointments.find((app) => now >= new Date(app.startTime) && now <= endOf(app));
    const next = appointments.find((app) => now < new Date(app.startTime));
    const appointment = active ?? next ?? appointments[0];
    const isActive = Boolean(active);
    const appointmentEnd = endOf(appointment);

    const sessionMode = isActive
      ? (appointment.type === "testing" ? "testing" : "training")
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
    console.error("Error loading today's appointment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
