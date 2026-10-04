import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, isTherapistOf } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== "THERAPIST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { studentId } = await params;

    if (!(await isTherapistOf(authUser.userId, studentId))) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // progressResetAt tells the child's browser to drop its cached progress.
    const updatedChild = await prisma.child.update({
      where: { userId: studentId },
      data: { progressResetAt: new Date() },
    });

    // Reset the paths of every category: the first group becomes available, the rest blocked.
    const allPaths = await prisma.path.findMany({
      where: { childId: studentId },
      include: { exerciseGroup: { select: { groupType: true } } },
      orderBy: { position: "asc" },
    });

    const pathsByType: Record<string, typeof allPaths> = {};
    for (const path of allPaths) {
      const type = path.exerciseGroup.groupType;
      if (!pathsByType[type]) pathsByType[type] = [];
      pathsByType[type].push(path);
    }

    const updates = Object.values(pathsByType).flatMap((paths) =>
      paths.map((path, i) =>
        prisma.path.update({
          where: { id: path.id },
          data: { status: i === 0 ? "available" : "blocked" },
        })
      )
    );

    await prisma.$transaction(updates);

    return NextResponse.json({
      success: true,
      progressResetAt: updatedChild.progressResetAt,
      pathsReset: updates.length,
    });
  } catch (err) {
    console.error("Error resetting progress:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

