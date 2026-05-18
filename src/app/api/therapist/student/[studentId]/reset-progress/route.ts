import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    // Verifica token terapista
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "secret";
    const decoded = jwt.verify(token, secret) as { role: string; id: string };

    if (decoded.role !== "THERAPIST") {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }

    // 1. Aggiorna progressResetAt (trigger per il localStorage del bambino)
    const updatedChild = await prisma.child.update({
      where: { userId: studentId },
      data: { progressResetAt: new Date() },
    });

    // 2. Resetta i Path nel DB per ogni categoria:
    //    - Ordina i Path per posizione all'interno di ogni groupType
    //    - Il primo di ogni tipo → "available", gli altri → "blocked"
    const allPaths = await prisma.path.findMany({
      where: { childId: studentId },
      include: { exerciseGroup: { select: { groupType: true } } },
      orderBy: { position: "asc" },
    });

    // Raggruppa per tipo
    const pathsByType: Record<string, typeof allPaths> = {};
    for (const path of allPaths) {
      const type = path.exerciseGroup.groupType;
      if (!pathsByType[type]) pathsByType[type] = [];
      pathsByType[type].push(path);
    }

    // Per ogni tipo: primo = available, resto = blocked
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
    console.error("Errore reset progressi:", err);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

