import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createGoogleCalendarEvent } from "@/lib/google";
import { getAuthUser, isTherapistOf } from "@/lib/auth";

export async function GET(req: Request) {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== "THERAPIST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: { therapistId: authUser.userId },
      include: {
        child: { include: { user: true } },
        prescribedGroups: true
      },
      orderBy: { startTime: 'asc' }
    });

    const formatted = appointments.map((app) => ({
      id: app.id,
      childName: `${app.child.user.name} ${app.child.user.surname}`,
      startTime: app.startTime.toISOString(),
      type: app.type,
      duration: app.duration,
      note: app.note,
      trainingExercises: app.trainingExercises,
      testingExercises: app.testingExercises,
      prescribedExercises: app.prescribedGroups.map(g => ({ id: g.id, title: g.title, groupType: g.groupType })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Error loading appointments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== "THERAPIST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { startTime, type, duration, note, childId, trainingExercises, testingExercises, prescribedGroups } = body;

    if (!childId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (!(await isTherapistOf(authUser.userId, childId))) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        startTime: new Date(startTime),
        type: type,
        duration: `${duration} min`,
        note: note,
        therapistId: authUser.userId,
        childId: childId,
        trainingExercises: Number(trainingExercises) || 0,
        testingExercises: Number(testingExercises) || 0,
        prescribedGroups: {
          connect: (prescribedGroups || []).map((id: string) => ({ id }))
        }
      },
      include: {
        prescribedGroups: true,
        child: { include: { user: true } }
      }
    });

    try {
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const summary = `Therapy session (${type}) - ${appointment.child.user.name} ${appointment.child.user.surname}`;
      let description = note || "";
      if (prescribedGroups && prescribedGroups.length > 0) {
        description += `\nPrescribed exercises: ${appointment.prescribedGroups.map((g: any) => g.title).join(', ')}`;
      }

      await createGoogleCalendarEvent(authUser.userId, {
        summary,
        description,
        startTime: startDate,
        endTime: endDate
      });
    } catch (gcalError) {
      console.error("Google Calendar sync error:", gcalError);
      // A calendar failure must not block the appointment.
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error saving appointment:", error);
    return NextResponse.json({ error: "Error saving the appointment" }, { status: 500 });
  }
}